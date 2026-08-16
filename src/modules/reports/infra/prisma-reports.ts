import { Injectable } from '@nestjs/common';
import {
  fimDoDia,
  inicioDoDia,
  paraDataLocalISO,
} from 'src/modules/common/domain/periodo';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  AppointmentsDetailReport,
  AttendanceReport,
  DashboardReport,
  MetricsReport,
  OperationMetric,
  ReportPeriod,
  ReportRepository,
  RevenueReport,
  ServiceRankingItem,
  ServicesReport,
} from '../domain/report.repository';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Valor de servico de um agendamento = soma dos precos CONGELADOS dos itens.
 * Definicao unica: o dashboard e o relatorio de faturamento tinham cada um a
 * sua copia, e divergiram — a tela mostrava dois faturamentos diferentes para
 * o mesmo dia.
 */
const somaServicos = (a: { services: { unitPrice: number }[] }) =>
  a.services.reduce((total, s) => total + s.unitPrice, 0);

/** Receita de multa por cancelamento tardio, so a efetivamente registrada. */
const somaMultas = (
  agendamentos: { chargeRegistered: boolean; chargeAmount: number | null }[],
) =>
  agendamentos
    .filter((a) => a.chargeRegistered)
    .reduce((sum, a) => sum + (a.chargeAmount ?? 0), 0);

@Injectable()
export class PrismaReportsRepository implements ReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceReport(period: ReportPeriod): Promise<AttendanceReport> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        appointmentDate: { gte: period.from, lte: period.to },
      },
      select: { status: true, appointmentDate: true },
    });

    const byDayOfWeek: Record<string, number> = {};
    let completed = 0;
    let cancelled = 0;

    for (const appointment of appointments) {
      if (appointment.status === 'COMPLETED') completed++;
      if (appointment.status === 'CANCELLED') cancelled++;

      const dayName = DAY_NAMES[appointment.appointmentDate.getDay()];
      byDayOfWeek[dayName] = (byDayOfWeek[dayName] ?? 0) + 1;
    }

    return {
      period: {
        from: paraDataLocalISO(period.from),
        to: paraDataLocalISO(period.to),
      },
      totalAppointments: appointments.length,
      completed,
      cancelled,
      byDayOfWeek,
    };
  }

  async getServicesReport(period: ReportPeriod): Promise<ServicesReport> {
    // Percorre os ITENS, nao os agendamentos: com 1:N, um atendimento de
    // corte + barba precisa contar uma vez para cada serviço no ranking.
    const itens = await this.prisma.appointmentService.findMany({
      where: {
        appointment: {
          status: 'COMPLETED',
          deletedAt: null,
          appointmentDate: { gte: period.from, lte: period.to },
        },
      },
      select: {
        serviceId: true,
        unitPrice: true,
        service: { select: { name: true } },
      },
    });

    const ranking = new Map<number, ServiceRankingItem>();
    for (const item of itens) {
      const current = ranking.get(item.serviceId) ?? {
        serviceId: item.serviceId,
        name: item.service.name,
        count: 0,
        totalRevenue: 0,
      };
      current.count += 1;
      current.totalRevenue += item.unitPrice;
      ranking.set(item.serviceId, current);
    }

    return {
      period: {
        from: paraDataLocalISO(period.from),
        to: paraDataLocalISO(period.to),
      },
      ranking: Array.from(ranking.values()).sort((a, b) => b.count - a.count),
    };
  }

  async getRevenueReport(period: ReportPeriod): Promise<RevenueReport> {
    const where = {
      deletedAt: null,
      appointmentDate: { gte: period.from, lte: period.to },
    };

    // Valor do atendimento = soma dos precos CONGELADOS dos servicos. Antes
    // isso lia `service.price` do cadastro, entao reajustar um servico
    // reescrevia o faturamento de meses ja fechados.
    const [completedAppointments, cancelledAppointments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { ...where, status: 'COMPLETED' },
        select: { services: { select: { unitPrice: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { ...where, status: 'CANCELLED' },
        select: {
          services: { select: { unitPrice: true } },
          chargeRegistered: true,
          chargeAmount: true,
        },
      }),
    ]);

    const completedRevenue = completedAppointments.reduce(
      (sum, a) => sum + somaServicos(a),
      0,
    );
    const lateChargeRevenue = somaMultas(cancelledAppointments);

    // Cancelamento que gerou multa vira RECEITA, nao perda. Antes o mesmo
    // agendamento entrava dos dois lados: a multa somava ao faturamento e o
    // valor cheio do servico somava as perdas. Perda agora e so o cancelamento
    // que nao rendeu nada.
    const lostRevenueByCancellation = cancelledAppointments
      .filter((a) => !a.chargeRegistered)
      .reduce((sum, a) => sum + somaServicos(a), 0);

    return {
      period: {
        from: paraDataLocalISO(period.from),
        to: paraDataLocalISO(period.to),
      },
      totalRevenue: completedRevenue + lateChargeRevenue,
      completedAppointments: completedAppointments.length,
      // Divide a receita DOS CONCLUIDOS pela contagem de concluidos. Usar o
      // total aqui misturava populacoes: a multa vem de um agendamento que nao
      // esta no denominador, e inflava o ticket de todo mundo.
      averageTicket:
        completedAppointments.length > 0
          ? completedRevenue / completedAppointments.length
          : 0,
      lostRevenueByCancellation,
    };
  }

  async getAppointmentsDetail(
    period: ReportPeriod,
  ): Promise<AppointmentsDetailReport> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        appointmentDate: { gte: period.from, lte: period.to },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        client: { select: { name: true, lastName: true } },
        services: {
          select: {
            unitPrice: true,
            durationMinutes: true,
            position: true,
            service: { select: { name: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
      // Mais recente primeiro: e o que o usuario quer conferir.
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
    });

    return {
      period: {
        from: paraDataLocalISO(period.from),
        to: paraDataLocalISO(period.to),
      },
      appointments: appointments.map((a) => ({
        id: a.id,
        date: paraDataLocalISO(a.appointmentDate),
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        clientName: [a.client.name, a.client.lastName]
          .filter(Boolean)
          .join(' '),
        durationMinutes: a.services.reduce(
          (total, s) => total + s.durationMinutes,
          0,
        ),
        total: somaServicos(a),
        services: a.services.map((s) => ({
          name: s.service.name,
          unitPrice: s.unitPrice,
          durationMinutes: s.durationMinutes,
        })),
      })),
    };
  }

  /**
   * Semana e mes vao ate o FIM do periodo, nao ate hoje.
   *
   * Cortar em `endOfToday` escondia atendimento ja concluido com data a frente:
   * no dia 16, o mes ia so ate o dia 16 e um concluido do dia 21 nao aparecia
   * em lugar nenhum. Como `summarize` so conta COMPLETED, esticar a janela nao
   * traz agendamento futuro em aberto para dentro do numero.
   */
  async getDashboard(): Promise<DashboardReport> {
    const now = new Date();
    const startOfToday = inicioDoDia(now);
    const endOfToday = fimDoDia(now);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Dia 0 do mes seguinte e o ultimo dia deste mes.
    const endOfMonth = fimDoDia(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );

    const [today, week, month] = await Promise.all([
      this.summarize(startOfToday, endOfToday),
      this.summarize(startOfWeek, endOfWeek),
      this.summarize(startOfMonth, endOfMonth),
    ]);

    return { today, week, month };
  }

  private async summarize(from: Date, to: Date) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        appointmentDate: { gte: from, lte: to },
      },
      select: {
        status: true,
        chargeRegistered: true,
        chargeAmount: true,
        services: { select: { unitPrice: true } },
      },
    });

    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const cancelled = appointments.filter((a) => a.status === 'CANCELLED');

    return {
      // So concluidos. Cancelado nao e atendimento, e agendamento ainda em
      // aberto tambem nao — antes isso contava tudo, entao a tela dizia
      // "5 atendimentos hoje" com 2 concluidos logo abaixo.
      appointments: completed.length,
      // Mesma definicao de faturamento do relatorio de receita: concluidos +
      // multa de cancelamento tardio. Enquanto o dashboard somava so os
      // concluidos, os dois numeros da tela discordavam para o mesmo dia.
      revenue:
        completed.reduce((sum, a) => sum + somaServicos(a), 0) +
        somaMultas(cancelled),
    };
  }

  async getMetrics(period: ReportPeriod): Promise<MetricsReport> {
    const logs = await this.prisma.operationLog.findMany({
      where: { createdAt: { gte: period.from, lte: period.to } },
      select: {
        operation: true,
        duration: true,
        success: true,
        errorMessage: true,
      },
    });

    const operations: Record<
      string,
      OperationMetric & { _totalDuration: number; _successCount: number }
    > = {};
    let totalErrors = 0;
    let conflictsBlocked = 0;

    for (const log of logs) {
      if (!log.success) {
        totalErrors++;
        if (
          log.errorMessage?.includes('Já existe um agendamento neste horário')
        ) {
          conflictsBlocked++;
        }
      }

      const entry = operations[log.operation] ?? {
        count: 0,
        avgDuration: 0,
        successRate: 0,
        _totalDuration: 0,
        _successCount: 0,
      };
      entry.count += 1;
      entry._totalDuration += log.duration;
      if (log.success) entry._successCount += 1;
      operations[log.operation] = entry;
    }

    const result: Record<string, OperationMetric> = {};
    for (const [operation, entry] of Object.entries(operations)) {
      result[operation] = {
        count: entry.count,
        avgDuration: entry.count > 0 ? entry._totalDuration / entry.count : 0,
        successRate: entry.count > 0 ? entry._successCount / entry.count : 0,
      };
    }

    return {
      period: {
        from: paraDataLocalISO(period.from),
        to: paraDataLocalISO(period.to),
      },
      operations: result,
      totalErrors,
      conflictsBlocked,
    };
  }
}
