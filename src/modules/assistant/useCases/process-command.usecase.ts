import { Inject, Injectable, Logger } from '@nestjs/common';
import type { CommandStatus, CommandTool } from '@prisma/client';
import type { AssistantRepository } from '../domain/assistant.repository';
import {
  AssistantUnavailableError,
  GeminiClient,
} from '../infra/gemini.client';

import { FindAppointmentsByDateUseCase } from 'src/modules/appointments/useCases/find-appointments-by-date.usecase';
import { CreateAppointmentUseCase } from 'src/modules/appointments/useCases/create-appointment.usecase';
import { AppointmentScheduleValidator } from 'src/modules/appointments/domain/appointment-schedule.validator';
import { CreateClientUseCase } from 'src/modules/clients/useCases/create-client.usecase';
import { AttendanceReportUseCase } from 'src/modules/reports/useCases/attendance-report.usecase';
import { RevenueReportUseCase } from 'src/modules/reports/useCases/revenue-report.usecase';
import { ServicesReportUseCase } from 'src/modules/reports/useCases/services-report.usecase';
import { fimDoDia, inicioDoDia } from 'src/modules/common/domain/periodo';
import type { ClientRepository } from 'src/modules/clients/domain/client.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';

const FERRAMENTAS: CommandTool[] = [
  'QUERY_SCHEDULE',
  'CREATE_APPOINTMENT',
  'REGISTER_CLIENT',
  'GENERATE_REPORT',
];

const MENSAGEM_FALLBACK =
  'Não consegui entender o que você quer fazer. Posso consultar agendamentos, criar agendamentos, cadastrar clientes ou gerar relatórios.';

/**
 * Confirmacao deterministica por ferramenta, usada quando a operacao deu certo
 * mas o modelo nao conseguiu redigir a resposta. Nunca diga "deu erro" aqui: a
 * acao ja aconteceu e o usuario precisa saber disso.
 */
const CONFIRMACAO_SEM_LLM: Record<CommandTool, string> = {
  QUERY_SCHEDULE:
    'Consultei a agenda, mas não consegui redigir o resumo. Tente novamente.',
  CREATE_APPOINTMENT:
    'Agendamento criado com sucesso. (Não consegui redigir a confirmação completa.)',
  REGISTER_CLIENT:
    'Cliente cadastrado com sucesso. (Não consegui redigir a confirmação completa.)',
  GENERATE_REPORT:
    'Relatório gerado, mas não consegui redigir o resumo. Tente novamente.',
};

/** Os args vêm do LLM como `unknown`: nada garante tipo, então coage explicitamente. */
const texto = (valor: unknown): string =>
  typeof valor === 'string' ? valor : '';

/**
 * Data vinda do LLM, validada antes de virar Date.
 *
 * Sem isso, um "21-08-2026" (DD-MM-YYYY) passa direto por
 * `parseAppointmentDate`, que le o primeiro campo como ano: o agendamento vai
 * parar no ano 21 e ninguem percebe. Como a saida do modelo nao e garantida,
 * o formato e conferido aqui em vez de confiado a instrucao.
 */
const dataDoModelo = (valor: unknown, campo: string): string => {
  const bruto = texto(valor).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bruto)) {
    throw new Error(
      `Data inválida em "${campo}": "${bruto}". Use o formato YYYY-MM-DD.`,
    );
  }

  const [ano, mes, dia] = bruto.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  // Rejeita datas que "existem" no formato mas nao no calendario (31/02).
  if (
    d.getFullYear() !== ano ||
    d.getMonth() !== mes - 1 ||
    d.getDate() !== dia
  ) {
    throw new Error(`Data inexistente em "${campo}": "${bruto}".`);
  }

  return bruto;
};

/** Agendamento com as relações que `getByDate` traz via include. */
type AgendamentoDetalhado = {
  startTime: string;
  endTime: string;
  status: string;
  client?: { name?: string | null; lastName?: string | null } | null;
  services?: { service?: { name?: string | null } | null }[] | null;
  professional?: { name?: string | null } | null;
};

type ClienteCriado = {
  id: number;
  name: string;
  lastName: string | null;
  cellPhone: string;
};

export type CommandResponse = {
  response: string;
  toolExecuted: CommandTool | null;
  status: CommandStatus;
  commandId: number;
};

@Injectable()
export class ProcessCommandUseCase {
  private readonly logger = new Logger(ProcessCommandUseCase.name);

  constructor(
    private readonly gemini: GeminiClient,
    @Inject('AssistantRepository')
    private readonly assistantRepository: AssistantRepository,
    private readonly findAppointmentsByDate: FindAppointmentsByDateUseCase,
    private readonly createAppointment: CreateAppointmentUseCase,
    private readonly createClient: CreateClientUseCase,
    private readonly attendanceReport: AttendanceReportUseCase,
    private readonly revenueReport: RevenueReportUseCase,
    private readonly servicesReport: ServicesReportUseCase,
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
    @Inject('ServiceRepository')
    private readonly serviceRepository: ServicesRepository,
  ) {}

  /**
   * Entrada por voz. E so um adaptador: transcreve e entrega ao mesmo fluxo de
   * texto, entao todo o tratamento de erro, RN18/RN19/RN20 e registro valem
   * identicamente para comando falado.
   */
  async executeAudio(
    userId: number,
    audio: Buffer,
    mimeType: string,
  ): Promise<CommandResponse & { transcription: string }> {
    const inicio = Date.now();

    let transcricao: string;
    try {
      transcricao = await this.gemini.transcrever(audio, mimeType);
    } catch (erro) {
      const mensagem = this.mensagemDeErro(erro);
      this.logger.error(`Falha ao transcrever áudio: ${mensagem}`);

      const salvo = await this.salvarERetornar({
        userId,
        rawText: '[áudio não transcrito]',
        status: 'EXECUTION_ERROR',
        result:
          this.mensagemAmigavelDeInfra(erro, mensagem) ??
          'Não consegui processar o áudio. Tente novamente.',
        errorMessage: mensagem,
        durationMs: Date.now() - inicio,
      });
      return { ...salvo, transcription: '' };
    }

    if (!transcricao) {
      const salvo = await this.salvarERetornar({
        userId,
        rawText: '[áudio sem fala reconhecida]',
        status: 'UNSUPPORTED_INTENT',
        result:
          'Não consegui entender o áudio. Tente falar mais perto do microfone.',
        durationMs: Date.now() - inicio,
      });
      return { ...salvo, transcription: '' };
    }

    // Repassa o inicio para o durationMs cobrir transcricao + interpretacao —
    // e o tempo que o usuario realmente esperou.
    const resultado = await this.execute(userId, transcricao, inicio);
    return { ...resultado, transcription: transcricao };
  }

  async execute(
    userId: number,
    rawText: string,
    inicioMs?: number,
  ): Promise<CommandResponse> {
    const inicio = inicioMs ?? Date.now();
    const agora = new Date();

    try {
      const chat = this.gemini.criarChat(agora);

      const primeiraResposta = await this.gemini.comTimeout(
        chat.sendMessage({ message: rawText }),
      );

      // No SDK atual `functionCalls` e `text` sao getters, nao metodos.
      const chamada = primeiraResposta.functionCalls?.[0];

      if (!chamada?.name) {
        // O modelo respondeu em texto: nao mapeou para nenhuma das 4 operacoes.
        return this.salvarERetornar({
          userId,
          rawText,
          status: 'UNSUPPORTED_INTENT',
          result: primeiraResposta.text?.trim() || MENSAGEM_FALLBACK,
          durationMs: Date.now() - inicio,
        });
      }

      if (!FERRAMENTAS.includes(chamada.name as CommandTool)) {
        return this.salvarERetornar({
          userId,
          rawText,
          interpretedIntent: chamada.name,
          status: 'INTERPRETATION_ERROR',
          result: MENSAGEM_FALLBACK,
          errorMessage: `Função desconhecida: ${chamada.name}`,
          durationMs: Date.now() - inicio,
        });
      }

      const ferramenta = chamada.name as CommandTool;
      const argumentos: Record<string, unknown> = chamada.args ?? {};

      // Erro de regra de negocio NAO aborta o fluxo: ele volta ao Gemini como
      // resultado da function para virar frase. E o que faz "agendei pra
      // terça" responder "só atendemos sextas e sábados" em vez do erro
      // generico de sistema (criterio de aceitacao 3).
      let resultadoFuncao: unknown;
      let erroNegocio: string | null = null;

      try {
        resultadoFuncao = await this.executarFuncao(
          ferramenta,
          argumentos,
          userId,
        );
      } catch (erro) {
        erroNegocio = this.mensagemDeErro(erro);
        resultadoFuncao = { sucesso: false, erro: erroNegocio };
      }

      // A funcao JA executou neste ponto. Se a chamada que redige a resposta
      // falhar (timeout, 429), deixar a excecao subir jogaria tudo no catch
      // externo: o comando seria gravado com toolExecuted null e o usuario
      // veria "ocorreu um erro" — enquanto o agendamento existe no banco.
      // Por isso a falha de redacao vira apenas uma frase menos bonita.
      let textoNatural: string;
      let erroRedacao: string | null = null;

      try {
        const respostaFinal = await this.gemini.comTimeout(
          chat.sendMessage({
            message: [
              {
                functionResponse: {
                  name: ferramenta,
                  response: { result: resultadoFuncao },
                },
              },
            ],
          }),
        );
        textoNatural =
          respostaFinal.text?.trim() || erroNegocio || 'Operação concluída.';
      } catch (erro) {
        erroRedacao = this.mensagemDeErro(erro);
        this.logger.error(
          `Função ${ferramenta} executou, mas falhou ao redigir a resposta: ${erroRedacao}`,
        );
        textoNatural = erroNegocio ?? CONFIRMACAO_SEM_LLM[ferramenta];
      }

      return this.salvarERetornar({
        userId,
        rawText,
        interpretedIntent: ferramenta,
        toolExecuted: ferramenta,
        parameters: argumentos,
        // Nada foi persistido quando houve erro de negocio — o use case lancou
        // antes de gravar. Isso e exatamente a RN19.
        status: erroNegocio ? 'EXECUTION_ERROR' : 'SUCCESS',
        result: textoNatural,
        // Guarda os dois: a falha de redacao nao invalida a operacao, mas
        // precisa aparecer nas metricas.
        errorMessage:
          erroNegocio ??
          (erroRedacao ? `Falha ao redigir resposta: ${erroRedacao}` : null),
        durationMs: Date.now() - inicio,
      });
    } catch (erro) {
      // Aqui so chega falha de infraestrutura (Gemini fora, timeout, chave
      // ausente). O restante da API continua funcionando (RNF09).
      const mensagem = this.mensagemDeErro(erro);
      this.logger.error(`Falha ao processar comando: ${mensagem}`);

      return this.salvarERetornar({
        userId,
        rawText,
        status: 'EXECUTION_ERROR',
        result:
          this.mensagemAmigavelDeInfra(erro, mensagem) ??
          'Ocorreu um erro ao processar o comando. Tente novamente.',
        errorMessage: mensagem,
        durationMs: Date.now() - inicio,
      });
    }
  }

  private async executarFuncao(
    ferramenta: CommandTool,
    args: Record<string, unknown>,
    userId: number,
  ): Promise<unknown> {
    switch (ferramenta) {
      case 'QUERY_SCHEDULE': {
        const data =
          args.date === undefined || args.date === null
            ? new Date()
            : dataDoModelo(args.date, 'date');
        const agendamentos = (await this.findAppointmentsByDate.execute(
          data,
        )) as unknown as AgendamentoDetalhado[];

        return {
          data: AppointmentScheduleValidator.parseAppointmentDate(data)
            .toISOString()
            .slice(0, 10),
          total: agendamentos.length,
          // Projeta apenas o necessario: mandar a entidade inteira gasta token
          // e vaza campos que o assistente nao deve comentar.
          agendamentos: agendamentos.map((a) => ({
            horario: a.startTime,
            termino: a.endTime,
            cliente: [a.client?.name, a.client?.lastName]
              .filter(Boolean)
              .join(' '),
            servicos: (a.services ?? []).map((s) => s.service?.name),
            profissional: a.professional?.name,
            status: a.status,
          })),
        };
      }

      case 'CREATE_APPOINTMENT': {
        const nomeCliente = texto(args.clientName);

        const cliente = await this.clientRepository.findByName(nomeCliente);
        if (!cliente) {
          throw new Error(
            `Cliente "${nomeCliente}" não encontrado. Cadastre-o primeiro.`,
          );
        }

        // O modelo manda uma lista; aceita string solta por robustez, caso
        // ele ignore o schema e devolva "corte" em vez de ["corte"].
        const nomesServicos = Array.isArray(args.serviceNames)
          ? args.serviceNames.map(texto).filter(Boolean)
          : [texto(args.serviceNames)].filter(Boolean);

        if (!nomesServicos.length) {
          throw new Error('Informe ao menos um serviço para o agendamento.');
        }

        const servicos: { id: number; name: string }[] = [];
        for (const nome of nomesServicos) {
          const servico = await this.serviceRepository.findByName(nome);
          if (!servico) {
            throw new Error(`Serviço "${nome}" não encontrado.`);
          }
          servicos.push({ id: servico.id, name: servico.name });
        }

        const agendamento = await this.createAppointment.execute({
          clientId: cliente.id,
          serviceIds: servicos.map((s) => s.id),
          // O profissional e quem digitou o comando — nao ha como o LLM escolher.
          professionalId: userId,
          appointmentDate: AppointmentScheduleValidator.parseAppointmentDate(
            dataDoModelo(args.date, 'date'),
          ),
          startTime: texto(args.startTime),
          // Recalculado dentro do use case: soma das duracoes dos servicos.
          endTime: '',
          status: 'SCHEDULED',
        });

        return {
          sucesso: true,
          id: agendamento.id,
          cliente: cliente.name,
          servicos: servicos.map((s) => s.name),
          data: texto(args.date),
          horario: agendamento.startTime,
          termino: agendamento.endTime,
          duracaoMinutos: agendamento.durationMinutes,
        };
      }

      case 'REGISTER_CLIENT': {
        // O model guarda nome e sobrenome separados; o LLM manda o nome inteiro.
        const partes = texto(args.name).trim().split(/\s+/).filter(Boolean);
        const [primeiroNome, ...resto] = partes;

        if (!primeiroNome) {
          throw new Error('Nome do cliente não informado.');
        }

        const cliente = (await this.createClient.execute({
          name: primeiroNome,
          lastName: resto.join(' ') || null,
          cellPhone: texto(args.phone),
        })) as ClienteCriado;

        return {
          sucesso: true,
          id: cliente.id,
          nome: [cliente.name, cliente.lastName].filter(Boolean).join(' '),
          telefone: cliente.cellPhone,
        };
      }

      case 'GENERATE_REPORT': {
        const periodo = this.montarPeriodo(
          args.from ? dataDoModelo(args.from, 'from') : undefined,
          args.to ? dataDoModelo(args.to, 'to') : undefined,
        );
        const tipo = texto(args.type);

        switch (tipo) {
          case 'revenue':
            return this.revenueReport.execute(periodo);
          case 'services':
            return this.servicesReport.execute(periodo);
          case 'attendance':
            return this.attendanceReport.execute(periodo);
          default:
            throw new Error(
              `Tipo de relatório inválido: "${tipo}". Use attendance, revenue ou services.`,
            );
        }
      }
    }
  }

  /**
   * Mesmo default do ReportsController: mes corrente ate hoje.
   *
   * O modelo manda `YYYY-MM-DD`, que `new Date()` lia como meia-noite UTC —
   * no Brasil, o dia anterior. Pedir "agosto" gerava 31/07 a 30/08, perdendo
   * o ultimo dia do mes. Os helpers resolvem em hora local.
   */
  private montarPeriodo(from?: string, to?: string) {
    const fim = fimDoDia(to ?? new Date());
    const inicio = from
      ? inicioDoDia(from)
      : new Date(fim.getFullYear(), fim.getMonth(), 1);

    return { from: inicio, to: fim };
  }

  /**
   * Traduz falha de infraestrutura em frase util para o usuario. O 429 merece
   * destaque: no free tier o limite e por MINUTO (nao por dia), e cada comando
   * gasta duas chamadas — a que escolhe a function e a que redige a resposta.
   * Sem isso o usuario ve "erro, tente novamente" e nao entende que basta esperar.
   */
  private mensagemAmigavelDeInfra(
    erro: unknown,
    mensagem: string,
  ): string | null {
    if (erro instanceof AssistantUnavailableError) return mensagem;

    if (/RESOURCE_EXHAUSTED|"code":\s*429|quota/i.test(mensagem)) {
      const segundos = /retry in ([\d.]+)s/i.exec(mensagem)?.[1];
      const espera = segundos
        ? ` Tente de novo em ~${Math.ceil(Number(segundos))}s.`
        : '';
      return `O assistente atingiu o limite de requisições do plano gratuito.${espera}`;
    }

    if (/"code":\s*404|NOT_FOUND/i.test(mensagem)) {
      return 'O modelo configurado no GEMINI_MODEL não está disponível para esta chave.';
    }

    return null;
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof Error) return erro.message;

    // HttpException do Nest carrega a mensagem em `response`.
    if (erro && typeof erro === 'object' && 'response' in erro) {
      const resposta = (erro as { response: unknown }).response;
      if (typeof resposta === 'string') return resposta;
      if (
        resposta &&
        typeof resposta === 'object' &&
        'message' in resposta &&
        typeof (resposta as { message: unknown }).message === 'string'
      ) {
        return (resposta as { message: string }).message;
      }
    }

    return 'Erro desconhecido';
  }

  private async salvarERetornar(dados: {
    userId: number;
    rawText: string;
    interpretedIntent?: string | null;
    toolExecuted?: CommandTool | null;
    parameters?: Record<string, unknown> | null;
    status: CommandStatus;
    result: string;
    errorMessage?: string | null;
    durationMs: number;
  }): Promise<CommandResponse> {
    const salvo = await this.assistantRepository.saveCommand({
      userId: dados.userId,
      rawText: dados.rawText,
      interpretedIntent: dados.interpretedIntent ?? null,
      toolExecuted: dados.toolExecuted ?? null,
      parameters: dados.parameters ?? null,
      result: dados.result,
      status: dados.status,
      errorMessage: dados.errorMessage ?? null,
      durationMs: dados.durationMs,
    });

    return {
      response: dados.result,
      toolExecuted: dados.toolExecuted ?? null,
      status: dados.status,
      commandId: salvo.id,
    };
  }
}
