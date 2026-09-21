/**
 * Conjunto de comandos da avaliação controlada do módulo de linguagem natural.
 *
 * ESTE ARQUIVO É CONGELADO ANTES DA EXECUÇÃO. As expectativas são definidas a
 * priori e commitadas isoladamente; o hash desse commit vai na coluna
 * `commit_dataset` do CSV. Alterar qualquer expectativa depois de rodar
 * invalida a avaliação — se precisar mudar, gere um dataset novo com id novo
 * e rode tudo de novo.
 *
 * As datas NÃO são literais. A `montarSystemInstruction` injeta `new Date()` a
 * cada requisição e congelar o relógio exigiria mexer em produção, o que está
 * fora de escopo. Em vez disso, cada data esperada é uma ÂNCORA resolvida pelo
 * runner a partir de D0 (instante de início da passada). A regra é fixa; só o
 * valor concreto varia com o dia da execução.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Categoria =
  | 'consultar_agenda'
  | 'criar_agendamento'
  | 'cadastrar_cliente'
  | 'gerar_relatorio'
  | 'referencia_temporal'
  | 'violacao_regra'
  | 'fora_do_escopo'
  | 'incompleto_ambiguo'
  | 'comando_real';

export type Ferramenta =
  | 'QUERY_SCHEDULE'
  | 'CREATE_APPOINTMENT'
  | 'REGISTER_CLIENT'
  | 'GENERATE_REPORT';

/**
 * Âncoras temporais resolvidas pelo runner a partir de D0.
 *
 * DIA_UTIL é o primeiro dia de segunda a sábado dentro de [D0+1, D0+7]. Fica
 * dentro do limite da RN09 (7 dias) de propósito: os casos válidos de criação
 * não podem esbarrar por acidente na regra de antecedência.
 *
 * PASSADO é o dia útil anterior mais recente (estritamente antes de D0). Num
 * domingo coincide com D0-1 (sábado); numa segunda seria o sábado, não o
 * domingo — daí a regra em vez de "ontem" literal.
 */
export type Ancora =
  | 'D0'
  | 'D0_MAIS_1'
  | 'D0_MENOS_1'
  | 'D0_MENOS_30'
  | 'D0_MAIS_20'
  | 'DIA_UTIL'
  | 'DIA_UTIL_MAIS_7'
  | 'PROX_DOM'
  | 'PASSADO'
  | 'MES_INICIO'
  | 'SEMANA_ATUAL_INICIO'
  | 'SEMANA_ATUAL_FIM'
  | 'SEMANA_PROX_INICIO'
  | 'SEMANA_PROX_FIM'
  | 'SEMANA_ANTERIOR_INICIO'
  | 'SEMANA_ANTERIOR_FIM';

/** Valor esperado de um parâmetro. */
export type Esperado =
  /** Igualdade literal, após normalização. */
  | { tipo: 'literal'; valor: string }
  /** Data resolvida a partir de D0. */
  | { tipo: 'data'; ancora: Ancora }
  /** Conjunto de aceitação: qualquer um dos valores conta como acerto. */
  | { tipo: 'umDe'; opcoes: Esperado[] }
  /** O parâmetro pode vir ausente (o modelo pode omitir opcionais). */
  | { tipo: 'ausenteOu'; valor: Esperado }
  /** Lista comparada como CONJUNTO, case-insensitive. */
  | { tipo: 'conjunto'; valores: string[]; sinonimos?: string[][] }
  /** Telefone: comparado só por dígitos. */
  | { tipo: 'telefone'; digitos: string };

export type ResultadoEsperado =
  /** A operação deve concluir com sucesso. */
  | 'sucesso'
  /** A função deve ser chamada e barrada por regra de negócio, sem persistir. */
  | 'erro_regra'
  /** O modelo não deve chamar função nenhuma. */
  | 'nao_executar'
  /**
   * Sucesso ou erro de regra, ambos aceitáveis — o que importa é função e
   * parâmetros. Usado quando o desfecho depende do estado do banco ou do dia
   * da execução, e não do acerto de interpretação.
   */
  | 'sucesso_ou_erro_regra';

export type Comando = {
  id: string;
  categoria: Categoria;
  /** Esta rodada é só texto. Voz fica para uma rodada futura. */
  canal: 'texto';
  /** Pode conter marcadores {DIA_UTIL}, {PROX_DOM}, etc. */
  comando: string;
  /** `null` = esperado NÃO chamar função alguma. */
  funcaoEsperada: Ferramenta | null;
  parametrosEsperados: Record<string, Esperado>;
  resultadoEsperado: ResultadoEsperado;
  /**
   * Regra de negócio testada, quando houver. Só documental — vai para o
   * apêndice do TCC.
   */
  regra?: string;
  /**
   * Quando true, o item é reportado à parte e NÃO entra na taxa geral de
   * acerto. Usado para itens que medem limitação da superfície de funções, e
   * não capacidade de interpretação.
   */
  foraDaTaxaGeral?: boolean;
  /**
   * Quando true, registra a sub-métrica "modelo recusou" vs "validador
   * barrou". Vale para todos os casos de violação de regra.
   */
  registrarCaminhoDeBloqueio?: boolean;
  /**
   * Quando true, o `status` devolvido é reportado à parte e não conta como
   * erro do modelo — usado onde o desfecho depende de dados, não de
   * interpretação.
   */
  statusForaDaTaxa?: boolean;
  /** Origem, para os comandos extraídos do uso real. */
  origem?: string;
  /** Observação metodológica que vai para o apêndice. */
  nota?: string;
};

// ---------------------------------------------------------------------------
// Atalhos de construção
// ---------------------------------------------------------------------------

const data = (ancora: Ancora): Esperado => ({ tipo: 'data', ancora });
const lit = (valor: string): Esperado => ({ tipo: 'literal', valor });
const umDe = (...opcoes: Esperado[]): Esperado => ({ tipo: 'umDe', opcoes });
const ausenteOu = (valor: Esperado): Esperado => ({ tipo: 'ausenteOu', valor });
const tel = (digitos: string): Esperado => ({ tipo: 'telefone', digitos });

/**
 * O modelo pode mandar o nome curto ("corte") ou o do cadastro
 * ("Corte Masculino"). Os dois são interpretação correta — quem resolve o nome
 * para id é o `ProcessCommandUseCase`, via `serviceRepository.findByName`.
 */
const servicos = (valores: string[], sinonimos?: string[][]): Esperado => ({
  tipo: 'conjunto',
  valores,
  sinonimos,
});

const SIN_CORTE = ['corte', 'corte masculino'];
const SIN_BARBA = ['barba', 'barba completa'];

// ---------------------------------------------------------------------------
// A — Consultar agenda
// ---------------------------------------------------------------------------

const A: Comando[] = [
  {
    id: 'A01',
    categoria: 'consultar_agenda',
    canal: 'texto',
    comando: 'Quais são os agendamentos de hoje?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: ausenteOu(data('D0')) },
    resultadoEsperado: 'sucesso',
    statusForaDaTaxa: true,
    nota: 'Consultar domingo não é barrado: validate() só roda em create/update.',
  },
  {
    id: 'A02',
    categoria: 'consultar_agenda',
    canal: 'texto',
    comando: 'Tem alguém marcado hoje à tarde?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: ausenteOu(data('D0')) },
    resultadoEsperado: 'sucesso',
    statusForaDaTaxa: true,
  },
  {
    id: 'A03',
    categoria: 'consultar_agenda',
    canal: 'texto',
    comando: 'Como está a agenda do dia {DIA_UTIL}?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: data('DIA_UTIL') },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'A04',
    categoria: 'consultar_agenda',
    canal: 'texto',
    comando: 'Quantos atendimentos eu tenho hoje?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: ausenteOu(data('D0')) },
    resultadoEsperado: 'sucesso',
    statusForaDaTaxa: true,
  },
];

// ---------------------------------------------------------------------------
// B — Criar agendamento
// ---------------------------------------------------------------------------

const B: Comando[] = [
  {
    id: 'B01',
    categoria: 'criar_agendamento',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte no dia {DIA_UTIL} às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'B02',
    categoria: 'criar_agendamento',
    canal: 'texto',
    comando: 'Marca corte e barba para o Pedro dia {DIA_UTIL} às 14:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Pedro'),
      serviceNames: servicos(['corte', 'barba'], [SIN_CORTE, SIN_BARBA]),
      date: data('DIA_UTIL'),
      startTime: lit('14:00'),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Dois serviços: duração deve ser a soma (30 + 20 = 50 min).',
  },
  {
    id: 'B03',
    categoria: 'criar_agendamento',
    canal: 'texto',
    comando: 'Quero agendar a Barba Completa do Lucas no dia {DIA_UTIL} às 09:30',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Lucas'),
      serviceNames: servicos(['barba completa'], [SIN_BARBA]),
      date: data('DIA_UTIL'),
      startTime: lit('09:30'),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'B04',
    categoria: 'criar_agendamento',
    canal: 'texto',
    comando: 'Coloca o Carlos às 16:00 do dia {DIA_UTIL} para corte masculino',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte masculino'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('16:00'),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Ordem invertida: horário antes da data.',
  },
  {
    id: 'B05',
    categoria: 'criar_agendamento',
    canal: 'texto',
    comando: 'Agendamento para Pedro, corte, {DIA_UTIL}, 11:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Pedro'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('11:00'),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Telegráfico, sem verbo.',
  },
];

// ---------------------------------------------------------------------------
// C — Cadastrar cliente
// ---------------------------------------------------------------------------

const C: Comando[] = [
  {
    id: 'C01',
    categoria: 'cadastrar_cliente',
    canal: 'texto',
    comando: 'Cadastra a cliente Mariana Souza, telefone 11 97777-1234',
    funcaoEsperada: 'REGISTER_CLIENT',
    parametrosEsperados: {
      name: lit('Mariana Souza'),
      phone: tel('11977771234'),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'C02',
    categoria: 'cadastrar_cliente',
    canal: 'texto',
    comando: 'Novo cliente: Rafael Lima, 11966665555',
    funcaoEsperada: 'REGISTER_CLIENT',
    parametrosEsperados: {
      name: lit('Rafael Lima'),
      phone: tel('11966665555'),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'C03',
    categoria: 'cadastrar_cliente',
    canal: 'texto',
    comando: 'Adiciona a Ana Paula Ribeiro com o telefone (11) 93333-2211',
    funcaoEsperada: 'REGISTER_CLIENT',
    parametrosEsperados: {
      name: lit('Ana Paula Ribeiro'),
      phone: tel('11933332211'),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Nome composto de três partes: o use case separa primeiro nome do resto.',
  },
  {
    id: 'C04',
    categoria: 'cadastrar_cliente',
    canal: 'texto',
    comando: 'Registra o João Pedro no sistema, celular 11912345678',
    funcaoEsperada: 'REGISTER_CLIENT',
    parametrosEsperados: {
      name: lit('João Pedro'),
      phone: tel('11912345678'),
    },
    resultadoEsperado: 'sucesso',
  },
];

// ---------------------------------------------------------------------------
// D — Gerar relatório
// ---------------------------------------------------------------------------

const D: Comando[] = [
  {
    id: 'D01',
    categoria: 'gerar_relatorio',
    canal: 'texto',
    comando: 'Quanto eu faturei esse mês?',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('revenue'),
      from: ausenteOu(data('MES_INICIO')),
      to: ausenteOu(data('D0')),
    },
    resultadoEsperado: 'sucesso',
    nota: 'from/to são opcionais na declaração; o use case usa o mês corrente por padrão.',
  },
  {
    id: 'D02',
    categoria: 'gerar_relatorio',
    canal: 'texto',
    comando: 'Quais os serviços mais realizados no mês?',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('services'),
      from: ausenteOu(data('MES_INICIO')),
      to: ausenteOu(data('D0')),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'D03',
    categoria: 'gerar_relatorio',
    canal: 'texto',
    comando: 'Quantos atendimentos eu fiz esse mês?',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('attendance'),
      from: ausenteOu(data('MES_INICIO')),
      to: ausenteOu(data('D0')),
    },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'D04',
    categoria: 'gerar_relatorio',
    canal: 'texto',
    comando: 'Me dá o faturamento entre {D0_MENOS_30} e {D0}',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('revenue'),
      from: data('D0_MENOS_30'),
      to: data('D0'),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Período explícito: não depende de resolução de linguagem temporal.',
  },
];

// ---------------------------------------------------------------------------
// E — Referência temporal
// ---------------------------------------------------------------------------

const E: Comando[] = [
  {
    id: 'E01',
    categoria: 'referencia_temporal',
    canal: 'texto',
    comando: 'O que tenho marcado amanhã?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: data('D0_MAIS_1') },
    resultadoEsperado: 'sucesso',
  },
  {
    id: 'E02',
    categoria: 'referencia_temporal',
    canal: 'texto',
    comando: 'Me mostra o faturamento dessa semana',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('revenue'),
      // Com D0 no domingo, "essa semana" tem duas leituras defensáveis: a
      // semana que TERMINA hoje e a que COMEÇA amanhã. As duas entram no
      // conjunto de aceitação, fixado antes da execução.
      from: ausenteOu(
        umDe(data('SEMANA_ATUAL_INICIO'), data('SEMANA_PROX_INICIO')),
      ),
      to: ausenteOu(
        umDe(data('D0'), data('SEMANA_ATUAL_FIM'), data('SEMANA_PROX_FIM')),
      ),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Conjunto de aceitação ampliado porque D0 cai no domingo.',
  },
  {
    id: 'E03',
    categoria: 'referencia_temporal',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte na próxima {DIA_SEMANA_UTIL} às 15:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      // "próxima segunda" num domingo pode ser amanhã ou a segunda da semana
      // seguinte. A segunda leitura cai fora dos 7 dias da RN09 — por isso o
      // status é reportado à parte.
      date: umDe(data('DIA_UTIL'), data('DIA_UTIL_MAIS_7')),
      startTime: lit('15:00'),
    },
    resultadoEsperado: 'sucesso_ou_erro_regra',
    statusForaDaTaxa: true,
    nota: 'Leitura alternativa de "próxima X" aceita; se escolher D+8, a RN09 barra.',
  },
  {
    id: 'E04',
    categoria: 'referencia_temporal',
    canal: 'texto',
    comando: 'Quantos atendimentos na semana passada?',
    funcaoEsperada: 'GENERATE_REPORT',
    parametrosEsperados: {
      type: lit('attendance'),
      from: ausenteOu(
        umDe(data('SEMANA_ANTERIOR_INICIO'), data('SEMANA_ATUAL_INICIO')),
      ),
      to: ausenteOu(
        umDe(data('SEMANA_ANTERIOR_FIM'), data('SEMANA_ATUAL_FIM')),
      ),
    },
    resultadoEsperado: 'sucesso',
    nota: 'Idem E02: no domingo, "semana passada" admite duas janelas.',
  },
];

// ---------------------------------------------------------------------------
// F — Violação de regra de negócio
//
// Critério de acerto para TODOS: nenhum agendamento persistido. O modelo pode
// recusar antes de chamar a função (a system instruction já enuncia as regras)
// ou chamar e o validador barrar. Os dois são corretos; a distribuição entre
// eles é reportada como sub-métrica.
// ---------------------------------------------------------------------------

const F: Comando[] = [
  {
    id: 'F01',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Pedro para corte dia {DIA_UTIL} às 08:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Pedro'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('08:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'RN04 — conflito de horário do mesmo profissional',
    registrarCaminhoDeBloqueio: true,
    nota: 'O seed cria um agendamento em DIA_UTIL 08:00 para o MESMO profissional da avaliação.',
  },
  {
    id: 'F02',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Carlos para uma massagem relaxante dia {DIA_UTIL} às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['massagem relaxante']),
      date: data('DIA_UTIL'),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'Serviço inexistente no cadastro',
    registrarCaminhoDeBloqueio: true,
  },
  {
    id: 'F03',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte no domingo dia {PROX_DOM} às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('PROX_DOM'),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'RN01 — atendimento de segunda a sábado',
    registrarCaminhoDeBloqueio: true,
  },
  {
    id: 'F04',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda a Fernanda Costa para corte dia {DIA_UTIL} às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Fernanda Costa'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'Cliente inexistente no cadastro',
    registrarCaminhoDeBloqueio: true,
  },
  {
    id: 'F05',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte dia {DIA_UTIL} às 21:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('21:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'RN02 — horário fora de 08:00–12:00 e 13:15–19:30',
    registrarCaminhoDeBloqueio: true,
  },
  {
    id: 'F06',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte dia {D0_MAIS_20} às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('D0_MAIS_20'),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'erro_regra',
    // Rótulo corrigido: D0+20 é data FUTURA, então testa a cláusula de
    // antecedência máxima (MAX_ADVANCE_DAYS = 7), não a de data passada.
    regra: 'RN09 — antecedência máxima de 7 dias',
    registrarCaminhoDeBloqueio: true,
  },
  {
    id: 'F07',
    categoria: 'violacao_regra',
    canal: 'texto',
    comando: 'Agenda o Carlos para corte ontem às 10:00',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      // "ontem" literal é D0-1; PASSADO é o dia útil anterior mais recente.
      // Num domingo os dois coincidem (sábado). Os dois entram no conjunto,
      // para o item não ficar frágil se a avaliação rodar noutro dia.
      date: umDe(data('D0_MENOS_1'), data('PASSADO')),
      startTime: lit('10:00'),
    },
    resultadoEsperado: 'erro_regra',
    regra: 'RN09 — data passada',
    registrarCaminhoDeBloqueio: true,
  },
];

// ---------------------------------------------------------------------------
// G — Pedidos fora do escopo
//
// As funções de exclusão, cancelamento e troca de senha NÃO são declaradas ao
// modelo. Esta categoria mede como o assistente RESPONDE a pedidos que não tem
// como executar — não a eficácia de um mecanismo de bloqueio.
// ---------------------------------------------------------------------------

const G: Comando[] = [
  {
    id: 'G01',
    categoria: 'fora_do_escopo',
    canal: 'texto',
    comando: 'Exclui o agendamento do Carlos de hoje',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
  },
  {
    id: 'G02',
    categoria: 'fora_do_escopo',
    canal: 'texto',
    comando: 'Cancela todos os atendimentos de amanhã',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
  },
  {
    id: 'G03',
    categoria: 'fora_do_escopo',
    canal: 'texto',
    comando: 'Troca a minha senha para 1234',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
  },
  {
    id: 'G04',
    categoria: 'fora_do_escopo',
    canal: 'texto',
    comando: 'Apaga o cliente Pedro do sistema',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
  },
];

// ---------------------------------------------------------------------------
// H — Comando incompleto ou ambíguo
//
// A system instruction manda explicitamente NÃO inventar parâmetro obrigatório
// e perguntar o que falta.
// ---------------------------------------------------------------------------

const H: Comando[] = [
  {
    id: 'H01',
    categoria: 'incompleto_ambiguo',
    canal: 'texto',
    comando: 'Agenda o Carlos amanhã às 10:00',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    nota: 'Falta o serviço. A instrução cita esse caso nominalmente.',
  },
  {
    id: 'H02',
    categoria: 'incompleto_ambiguo',
    canal: 'texto',
    comando: 'Marca um horário pra semana que vem',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    nota: 'Faltam cliente, serviço e horário.',
  },
  {
    id: 'H03',
    categoria: 'incompleto_ambiguo',
    canal: 'texto',
    comando: 'Faz um relatório',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    nota: 'Falta o tipo, que é obrigatório na declaração de GENERATE_REPORT.',
  },
];

// ---------------------------------------------------------------------------
// I — Comandos reais
//
// Extraídos da tabela AssistantCommand do uso real (n = 42). Grafia, erros de
// digitação e ordem das palavras preservados; nomes de pessoas substituídos
// pelos clientes do seed e telefones por números fictícios.
// ---------------------------------------------------------------------------

const I: Comando[] = [
  {
    id: 'I01',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Quais os agendamrntos de hoje ?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: { date: ausenteOu(data('D0')) },
    resultadoEsperado: 'sucesso',
    statusForaDaTaxa: true,
    origem: 'AssistantCommand id 22',
    nota: 'Erro de digitação em "agendamentos". No uso real resolveu corretamente.',
  },
  {
    id: 'I02',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Agenda o Carlos para {DIA_SEMANA_UTIL} às 10:30 serviço corte',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Carlos'),
      serviceNames: servicos(['corte'], [SIN_CORTE]),
      date: data('DIA_UTIL'),
      startTime: lit('10:30'),
    },
    resultadoEsperado: 'sucesso',
    origem: 'AssistantCommand id 33',
    nota: 'Dia da semana por nome, serviço no fim da frase.',
  },
  {
    id: 'I03',
    categoria: 'comando_real',
    canal: 'texto',
    comando:
      'Preciso que vc agende para a próxima {DIA_SEMANA_UTIL} o cliente Pedro para as 10:30 corte masculino',
    funcaoEsperada: 'CREATE_APPOINTMENT',
    parametrosEsperados: {
      clientName: lit('Pedro'),
      serviceNames: servicos(['corte masculino'], [SIN_CORTE]),
      date: umDe(data('DIA_UTIL'), data('DIA_UTIL_MAIS_7')),
      startTime: lit('10:30'),
    },
    resultadoEsperado: 'sucesso_ou_erro_regra',
    statusForaDaTaxa: true,
    origem: 'AssistantCommand id 12',
    nota: 'Frase longa com "vc"; "próxima X" admite duas leituras, como em E03.',
  },
  {
    id: 'I04',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Quais os agendamentos dessa semana ?',
    funcaoEsperada: 'QUERY_SCHEDULE',
    parametrosEsperados: {
      date: ausenteOu(
        umDe(data('D0'), data('DIA_UTIL'), data('SEMANA_PROX_INICIO')),
      ),
    },
    resultadoEsperado: 'sucesso',
    foraDaTaxaGeral: true,
    statusForaDaTaxa: true,
    origem: 'AssistantCommand ids 36 e 37',
    nota: 'QUERY_SCHEDULE aceita apenas uma data, não um intervalo. Mede limitação da superfície de funções, não interpretação — por isso fica fora da taxa geral.',
  },
  {
    id: 'I05',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Quanto é 3+5',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    origem: 'AssistantCommand id 17',
  },
  {
    id: 'I06',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Cadastrar cliente Renata Alves com número tudo nove.',
    funcaoEsperada: 'REGISTER_CLIENT',
    parametrosEsperados: {
      name: lit('Renata Alves'),
      phone: tel('99999999999'),
    },
    resultadoEsperado: 'sucesso',
    origem: 'AssistantCommand id 13',
    nota: 'Número falado por extenso. No uso real resolveu para 99999999999.',
  },
  {
    id: 'I07',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Oi',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    origem: 'AssistantCommand id 30',
    nota: 'Saudação sem intenção: espera-se resposta explicando o que o assistente faz.',
  },
  {
    id: 'I08',
    categoria: 'comando_real',
    canal: 'texto',
    comando: 'Quantos clientes tenho cadastrado ?',
    funcaoEsperada: null,
    parametrosEsperados: {},
    resultadoEsperado: 'nao_executar',
    origem: 'AssistantCommand id 31',
    nota: 'Não existe função de contagem de clientes. No uso real virou EXECUTION_ERROR sem ferramenta em 11,8 s, o que sugere falha de infraestrutura e não recusa.',
  },
];

// ---------------------------------------------------------------------------

export const COMANDOS: Comando[] = [...A, ...B, ...C, ...D, ...E, ...F, ...G, ...H, ...I];

/** Identificador do dataset. Muda se qualquer expectativa mudar. */
export const DATASET_VERSAO = '1.0.0';

export const TOTAL_COMANDOS = COMANDOS.length;
