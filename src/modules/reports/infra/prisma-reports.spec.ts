import { PrismaService } from 'src/modules/prisma/prisma.service';
import { PrismaReportsRepository } from './prisma-reports';

/**
 * Toda a aritmetica de dinheiro mora aqui, no repositorio — os specs dos use
 * cases mockam o repositorio inteiro e por isso passavam com qualquer
 * implementacao. Estes testes cobrem as contas de verdade.
 */

type Agendamento = {
  status: string;
  chargeRegistered: boolean;
  chargeAmount: number | null;
  services: { unitPrice: number }[];
};

const concluido = (...precos: number[]): Agendamento => ({
  status: 'COMPLETED',
  chargeRegistered: false,
  chargeAmount: null,
  services: precos.map((unitPrice) => ({ unitPrice })),
});

const cancelado = (multa: number | null, ...precos: number[]): Agendamento => ({
  status: 'CANCELLED',
  chargeRegistered: multa !== null,
  chargeAmount: multa,
  services: precos.map((unitPrice) => ({ unitPrice })),
});

const agendado = (...precos: number[]): Agendamento => ({
  status: 'SCHEDULED',
  chargeRegistered: false,
  chargeAmount: null,
  services: precos.map((unitPrice) => ({ unitPrice })),
});

type ArgsFindMany = {
  where?: {
    status?: string;
    appointmentDate?: { gte: Date; lte: Date };
  };
};

/**
 * `getRevenueReport` faz duas consultas filtradas por status; `summarize` faz
 * uma so, sem filtro. O mock devolve a fatia certa lendo o `where` recebido.
 *
 * Devolve o `findMany` junto para que os testes de JANELA possam inspecionar o
 * intervalo pedido sem alcancar o campo privado do repositorio.
 */
const criarMock = (agendamentos: Agendamento[]) => {
  const findMany = jest.fn(({ where }: ArgsFindMany) => {
    const status = where?.status;
    return Promise.resolve(
      status ? agendamentos.filter((a) => a.status === status) : agendamentos,
    );
  });

  const prisma = {
    appointment: { findMany },
    appointmentService: { findMany: jest.fn().mockResolvedValue([]) },
    operationLog: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;

  return { prisma, findMany };
};

const prismaMock = (agendamentos: Agendamento[]) =>
  criarMock(agendamentos).prisma;

const periodo = {
  from: new Date(2026, 7, 1),
  to: new Date(2026, 7, 31, 23, 59, 59, 999),
};

describe('PrismaReportsRepository — faturamento', () => {
  it('ticket medio divide a receita dos CONCLUIDOS pela contagem de concluidos', async () => {
    // 8 concluidos de R$ 50 + 1 cancelamento com multa de R$ 50.
    const dados = [
      ...Array.from({ length: 8 }, () => concluido(50)),
      cancelado(50, 80),
    ];
    const repo = new PrismaReportsRepository(prismaMock(dados));

    const r = await repo.getRevenueReport(periodo);

    expect(r.completedAppointments).toBe(8);
    expect(r.totalRevenue).toBe(450); // 400 de servico + 50 de multa
    // A multa NAO entra aqui: ela vem de um agendamento que nao esta no
    // denominador. Antes isso dava 56,25.
    expect(r.averageTicket).toBe(50);
  });

  it('ticket medio e zero sem nenhum concluido, mesmo havendo multa', async () => {
    const repo = new PrismaReportsRepository(prismaMock([cancelado(30, 80)]));

    const r = await repo.getRevenueReport(periodo);

    expect(r.averageTicket).toBe(0);
    expect(r.totalRevenue).toBe(30);
  });

  it('cancelamento com multa gera receita e NAO conta como perda', async () => {
    const repo = new PrismaReportsRepository(prismaMock([cancelado(20, 50)]));

    const r = await repo.getRevenueReport(periodo);

    expect(r.totalRevenue).toBe(20);
    // Antes somava os R$ 50 cheios aqui, contando o mesmo agendamento como
    // receita e como perda ao mesmo tempo.
    expect(r.lostRevenueByCancellation).toBe(0);
  });

  it('cancelamento sem multa conta como perda pelo valor cheio', async () => {
    const repo = new PrismaReportsRepository(prismaMock([cancelado(null, 50)]));

    const r = await repo.getRevenueReport(periodo);

    expect(r.totalRevenue).toBe(0);
    expect(r.lostRevenueByCancellation).toBe(50);
  });

  it('soma os precos congelados de TODOS os servicos do atendimento', async () => {
    // Corte 45 + barba 25 num unico agendamento conta como um atendimento so.
    const repo = new PrismaReportsRepository(prismaMock([concluido(45, 25)]));

    const r = await repo.getRevenueReport(periodo);

    expect(r.completedAppointments).toBe(1);
    expect(r.totalRevenue).toBe(70);
    expect(r.averageTicket).toBe(70);
  });

  it('devolve o periodo em data local, sem pular para o dia seguinte', async () => {
    const repo = new PrismaReportsRepository(prismaMock([]));

    const r = await repo.getRevenueReport(periodo);

    expect(r.period).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });
});

describe('PrismaReportsRepository — detalhamento', () => {
  const comDetalhe = () =>
    ({
      appointment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 29,
            appointmentDate: new Date(2026, 7, 21),
            startTime: '08:00',
            endTime: '08:50',
            status: 'COMPLETED',
            client: { name: 'João', lastName: 'Pedro' },
            services: [
              {
                unitPrice: 45,
                durationMinutes: 30,
                position: 0,
                service: { name: 'Corte Masculino' },
              },
              {
                unitPrice: 25,
                durationMinutes: 20,
                position: 1,
                service: { name: 'Barba Completa' },
              },
            ],
          },
          {
            id: 30,
            appointmentDate: new Date(2026, 7, 7),
            startTime: '09:00',
            endTime: '09:30',
            status: 'CANCELLED',
            client: { name: 'Carlos', lastName: null },
            services: [
              {
                unitPrice: 45,
                durationMinutes: 30,
                position: 0,
                service: { name: 'Corte Masculino' },
              },
            ],
          },
        ]),
      },
      appointmentService: { findMany: jest.fn().mockResolvedValue([]) },
      operationLog: { findMany: jest.fn().mockResolvedValue([]) },
    }) as unknown as PrismaService;

  it('soma preco e duracao dos itens de cada agendamento', async () => {
    const repo = new PrismaReportsRepository(comDetalhe());

    const { appointments } = await repo.getAppointmentsDetail(periodo);
    const [primeiro] = appointments;

    expect(primeiro.total).toBe(70); // 45 + 25
    expect(primeiro.durationMinutes).toBe(50); // 30 + 20
    expect(primeiro.services.map((s) => s.name)).toEqual([
      'Corte Masculino',
      'Barba Completa',
    ]);
  });

  it('devolve a data em dia local e junta nome do cliente', async () => {
    const repo = new PrismaReportsRepository(comDetalhe());

    const { appointments } = await repo.getAppointmentsDetail(periodo);

    expect(appointments[0].date).toBe('2026-08-21');
    expect(appointments[0].clientName).toBe('João Pedro');
    // Cliente sem sobrenome nao pode virar "Carlos null" nem sobrar espaco.
    expect(appointments[1].clientName).toBe('Carlos');
  });

  it('traz TODOS os status — filtrar e trabalho da tela', async () => {
    const repo = new PrismaReportsRepository(comDetalhe());

    const { appointments } = await repo.getAppointmentsDetail(periodo);

    expect(appointments.map((a) => a.status)).toEqual([
      'COMPLETED',
      'CANCELLED',
    ]);
  });
});

describe('PrismaReportsRepository — dashboard', () => {
  it('conta apenas atendimentos CONCLUIDOS', async () => {
    const dados = [
      concluido(50),
      concluido(50),
      agendado(50), // ainda em aberto
      cancelado(null, 50),
    ];
    const repo = new PrismaReportsRepository(prismaMock(dados));

    const { today } = await repo.getDashboard();

    // Antes contava os 4.
    expect(today.appointments).toBe(2);
  });

  it('a janela do mes vai ate o ULTIMO dia, nao ate hoje', async () => {
    const { prisma, findMany } = criarMock([]);
    const repo = new PrismaReportsRepository(prisma);

    await repo.getDashboard();

    // [hoje, semana, mes] — a terceira chamada e a do mes.
    const janelaMes = findMany.mock.calls[2][0].where?.appointmentDate;
    if (!janelaMes) throw new Error('consulta do mes sem intervalo de data');

    const hoje = new Date();
    const ultimoDiaDoMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
    ).getDate();

    expect(janelaMes.gte.getDate()).toBe(1);
    // Antes parava em `hoje`, e um concluido marcado para uma data a frente
    // dentro do mesmo mes sumia do relatorio.
    expect(janelaMes.lte.getDate()).toBe(ultimoDiaDoMes);
    expect(janelaMes.lte.getHours()).toBe(23);
  });

  it('usa a MESMA definicao de faturamento do relatorio de receita', async () => {
    const dados = [concluido(50), concluido(50), cancelado(30, 80)];
    const repo = new PrismaReportsRepository(prismaMock(dados));

    const { today } = await repo.getDashboard();
    const receita = await repo.getRevenueReport(periodo);

    // Os dois numeros aparecem juntos na tela de relatorios; discordar entre
    // si era o sintoma mais visivel.
    expect(today.revenue).toBe(receita.totalRevenue);
    expect(today.revenue).toBe(130); // 100 de servico + 30 de multa
  });
});
