import type {
  ReportRepository,
  RevenueReport,
} from '../domain/report.repository';
import { RevenueReportUseCase } from './revenue-report.usecase';

describe('RevenueReportUseCase', () => {
  let useCase: RevenueReportUseCase;
  let reportRepoMock: jest.Mocked<ReportRepository>;

  const period = { from: new Date('2026-06-01'), to: new Date('2026-06-30') };

  beforeEach(() => {
    reportRepoMock = {
      getAttendanceReport: jest.fn(),
      getServicesReport: jest.fn(),
      getRevenueReport: jest.fn(),
      getDashboard: jest.fn(),
      getMetrics: jest.fn(),
    };
    useCase = new RevenueReportUseCase(reportRepoMock);
  });

  it('soma apenas agendamentos concluídos (COMPLETED) ao faturamento', async () => {
    const report: RevenueReport = {
      period: { from: '2026-06-01', to: '2026-06-30' },
      totalRevenue: 400,
      completedAppointments: 8,
      averageTicket: 50,
      lostRevenueByCancellation: 0,
    };
    reportRepoMock.getRevenueReport.mockResolvedValue(report);

    const result = await useCase.execute(period);

    expect(reportRepoMock.getRevenueReport).toHaveBeenCalledWith(period);
    expect(result.totalRevenue).toBe(
      report.completedAppointments * report.averageTicket,
    );
  });

  it('inclui cancelamentos tardios com chargeRegistered = true no faturamento total', async () => {
    const reportComCobranca: RevenueReport = {
      period: { from: '2026-06-01', to: '2026-06-30' },
      totalRevenue: 450, // 400 de concluídos + 50 de cobrança por cancelamento tardio
      completedAppointments: 8,
      averageTicket: 50,
      lostRevenueByCancellation: 30,
    };
    reportRepoMock.getRevenueReport.mockResolvedValue(reportComCobranca);

    const result = await useCase.execute(period);

    expect(result.totalRevenue).toBeGreaterThan(
      result.completedAppointments * result.averageTicket - 1,
    );
    expect(result).toBe(reportComCobranca);
  });
});
