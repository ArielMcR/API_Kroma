import { ProcessCommandUseCase } from './process-command.usecase';
import { AssistantUnavailableError } from '../infra/gemini.client';

/**
 * Cobre o roteamento e a classificacao de status. O que importa aqui e que um
 * erro de REGRA DE NEGOCIO volte ao modelo para virar frase (e nao caia no erro
 * generico de sistema) — foi o ponto que o fluxo original do PRD errava.
 */
describe('ProcessCommandUseCase', () => {
  let useCase: ProcessCommandUseCase;
  let chat: { sendMessage: jest.Mock };
  let gemini: any;
  let assistantRepository: { saveCommand: jest.Mock };
  let findAppointmentsByDate: { execute: jest.Mock };
  let createAppointment: { execute: jest.Mock };
  let createClient: { execute: jest.Mock };
  let attendanceReport: { execute: jest.Mock };
  let revenueReport: { execute: jest.Mock };
  let servicesReport: { execute: jest.Mock };
  let clientRepository: { findByName: jest.Mock };
  let serviceRepository: { findByName: jest.Mock };

  /** Resposta do SDK: functionCalls e text sao getters, nao metodos. */
  const resposta = (opts: {
    texto?: string;
    funcao?: { name: string; args?: any };
  }) => ({
    get functionCalls() {
      return opts.funcao ? [opts.funcao] : undefined;
    },
    get text() {
      return opts.texto;
    },
  });

  beforeEach(() => {
    chat = { sendMessage: jest.fn() };
    gemini = {
      criarChat: jest.fn().mockReturnValue(chat),
      comTimeout: jest.fn((p: Promise<any>) => p),
    };
    assistantRepository = {
      saveCommand: jest.fn().mockResolvedValue({ id: 99 }),
    };
    findAppointmentsByDate = { execute: jest.fn().mockResolvedValue([]) };
    createAppointment = { execute: jest.fn() };
    createClient = { execute: jest.fn() };
    attendanceReport = { execute: jest.fn().mockResolvedValue({}) };
    revenueReport = { execute: jest.fn().mockResolvedValue({}) };
    servicesReport = { execute: jest.fn().mockResolvedValue({}) };
    clientRepository = { findByName: jest.fn() };
    serviceRepository = { findByName: jest.fn() };

    useCase = new ProcessCommandUseCase(
      gemini,
      assistantRepository as any,
      findAppointmentsByDate as any,
      createAppointment as any,
      createClient as any,
      attendanceReport as any,
      revenueReport as any,
      servicesReport as any,
      clientRepository as any,
      serviceRepository as any,
    );
  });

  it('registra UNSUPPORTED_INTENT quando o modelo responde em texto', async () => {
    chat.sendMessage.mockResolvedValueOnce(
      resposta({ texto: 'Posso ajudar com agenda e relatórios.' }),
    );

    const saida = await useCase.execute(1, 'qual a capital da Mongólia?');

    expect(saida.status).toBe('UNSUPPORTED_INTENT');
    expect(saida.toolExecuted).toBeNull();
    // Uma unica ida ao modelo: nao ha function para executar.
    expect(chat.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('executa QUERY_SCHEDULE e devolve SUCCESS', async () => {
    findAppointmentsByDate.execute.mockResolvedValue([
      {
        startTime: '09:00',
        endTime: '09:30',
        status: 'SCHEDULED',
        client: { name: 'Carlos', lastName: 'Almeida' },
        service: { name: 'Corte' },
        professional: { name: 'Ariel' },
      },
    ]);
    chat.sendMessage
      .mockResolvedValueOnce(
        resposta({
          funcao: { name: 'QUERY_SCHEDULE', args: { date: '2026-08-15' } },
        }),
      )
      .mockResolvedValueOnce(
        resposta({ texto: 'Você tem 1 agendamento hoje.' }),
      );

    const saida = await useCase.execute(1, 'agendamentos de hoje?');

    expect(saida.status).toBe('SUCCESS');
    expect(saida.toolExecuted).toBe('QUERY_SCHEDULE');
    expect(saida.response).toBe('Você tem 1 agendamento hoje.');
    expect(findAppointmentsByDate.execute).toHaveBeenCalledWith('2026-08-15');
  });

  it('devolve o erro de regra de negócio ao modelo e marca EXECUTION_ERROR', async () => {
    clientRepository.findByName.mockResolvedValue({ id: 7, name: 'Carlos' });
    serviceRepository.findByName.mockResolvedValue({ id: 3, name: 'Corte' });
    createAppointment.execute.mockRejectedValue(
      new Error('Agendamentos só são permitidos às sextas e sábados'),
    );

    chat.sendMessage
      .mockResolvedValueOnce(
        resposta({
          funcao: {
            name: 'CREATE_APPOINTMENT',
            args: {
              clientName: 'Carlos',
              serviceNames: ['Corte'],
              date: '2026-08-18',
              startTime: '09:00',
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        resposta({ texto: 'Só atendemos às sextas e sábados.' }),
      );

    const saida = await useCase.execute(1, 'agenda o Carlos terça às 9h');

    expect(saida.status).toBe('EXECUTION_ERROR');
    // A ferramenta fica registrada: o comando FOI interpretado, quem barrou foi
    // a regra de negocio. É o que diferencia isso de uma falha de infra.
    expect(saida.toolExecuted).toBe('CREATE_APPOINTMENT');
    expect(saida.response).toBe('Só atendemos às sextas e sábados.');

    // O erro precisa ter voltado ao modelo como resultado da function.
    const segundaChamada = chat.sendMessage.mock.calls[1][0];
    expect(
      segundaChamada.message[0].functionResponse.response.result,
    ).toMatchObject({ sucesso: false });
  });

  it('separa nome e sobrenome no REGISTER_CLIENT', async () => {
    createClient.execute.mockResolvedValue({
      id: 5,
      name: 'Maria',
      lastName: 'Aparecida',
      cellPhone: '44988887777',
    });
    chat.sendMessage
      .mockResolvedValueOnce(
        resposta({
          funcao: {
            name: 'REGISTER_CLIENT',
            args: { name: 'Maria Aparecida', phone: '44988887777' },
          },
        }),
      )
      .mockResolvedValueOnce(resposta({ texto: 'Cliente cadastrada.' }));

    await useCase.execute(1, 'cadastra Maria Aparecida 44988887777');

    expect(createClient.execute).toHaveBeenCalledWith({
      name: 'Maria',
      lastName: 'Aparecida',
      cellPhone: '44988887777',
    });
  });

  it('não derruba a aplicação quando o Gemini está indisponível', async () => {
    gemini.criarChat.mockImplementation(() => {
      throw new AssistantUnavailableError('Assistente não configurado');
    });

    const saida = await useCase.execute(1, 'agendamentos de hoje?');

    expect(saida.status).toBe('EXECUTION_ERROR');
    expect(saida.response).toBe('Assistente não configurado');
    // Registrado mesmo em falha de infra (RN19 / critério 7).
    expect(assistantRepository.saveCommand).toHaveBeenCalled();
  });

  it('recusa data em DD-MM-YYYY em vez de agendar no ano errado', async () => {
    clientRepository.findByName.mockResolvedValue({ id: 7, name: 'Carlos' });
    serviceRepository.findByName.mockResolvedValue({ id: 3, name: 'Corte' });

    chat.sendMessage
      .mockResolvedValueOnce(
        resposta({
          funcao: {
            name: 'CREATE_APPOINTMENT',
            args: {
              clientName: 'Carlos',
              serviceNames: ['Corte'],
              // Formato invertido: sem validação, "21" viraria o ano.
              date: '21-08-2026',
              startTime: '10:30',
            },
          },
        }),
      )
      .mockResolvedValueOnce(resposta({ texto: 'Não entendi a data.' }));

    const saida = await useCase.execute(1, 'agenda o Carlos dia 21-08-2026');

    expect(saida.status).toBe('EXECUTION_ERROR');
    // Nada pode ter sido persistido.
    expect(createAppointment.execute).not.toHaveBeenCalled();

    const segunda = chat.sendMessage.mock.calls[1][0];
    expect(segunda.message[0].functionResponse.response.result.erro).toContain(
      'YYYY-MM-DD',
    );
  });

  it('traduz o 429 do free tier em mensagem acionável', async () => {
    chat.sendMessage.mockRejectedValue(
      new Error(
        '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}} Please retry in 9.5s',
      ),
    );

    const saida = await useCase.execute(1, 'agendamentos de hoje?');

    expect(saida.status).toBe('EXECUTION_ERROR');
    expect(saida.response).toContain('limite de requisições');
  });
});
