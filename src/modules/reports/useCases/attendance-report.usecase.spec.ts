import type {
  AttendanceReport,
  ReportRepository,
} from '../domain/report.repository';
import { AttendanceReportUseCase } from './attendance-report.usecase';

describe('AttendanceReportUseCase', () => {
  let useCase: AttendanceReportUseCase;
  let reportRepoMock: jest.Mocked<ReportRepository>;

  const period = { from: new Date('2026-06-01'), to: new Date('2026-06-30') };

  const report: AttendanceReport = {
    period: { from: '2026-06-01', to: '2026-06-30' },
    totalAppointments: 10,
    completed: 7,
    cancelled: 3,
    byDayOfWeek: { friday: 6, saturday: 4 },
  };

  beforeEach(() => {
    reportRepoMock = {
      getAttendanceReport: jest.fn().mockResolvedValue(report),
      getServicesReport: jest.fn(),
      getRevenueReport: jest.fn(),
      getDashboard: jest.fn(),
      getMetrics: jest.fn(),
    };
    useCase = new AttendanceReportUseCase(reportRepoMock);
  });

  it('delega ao repositório passando o período, contando apenas agendamentos no intervalo', async () => {
    const result = await useCase.execute(period);

    expect(reportRepoMock.getAttendanceReport).toHaveBeenCalledWith(period);
    expect(result.totalAppointments).toBe(report.completed + report.cancelled);
  });

  it('separa o resultado por status (concluído/cancelado)', async () => {
    const result = await useCase.execute(period);

    expect(result.completed).toBe(7);
    expect(result.cancelled).toBe(3);
    expect(result).toBe(report);
  });
});
