import { Controller, Get, Query } from '@nestjs/common';
import { fimDoDia, inicioDoDia } from 'src/modules/common/domain/periodo';
import { PeriodDto } from '../dto/period.dto';
import { AttendanceReportUseCase } from '../../useCases/attendance-report.usecase';
import { ServicesReportUseCase } from '../../useCases/services-report.usecase';
import { RevenueReportUseCase } from '../../useCases/revenue-report.usecase';
import { DashboardReportUseCase } from '../../useCases/dashboard-report.usecase';
import { MetricsReportUseCase } from '../../useCases/metrics-report.usecase';
import { AppointmentsDetailUseCase } from '../../useCases/appointments-detail.usecase';
import type { ReportPeriod } from 'src/modules/reports/domain/report.repository';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly attendance: AttendanceReportUseCase,
    private readonly services: ServicesReportUseCase,
    private readonly revenue: RevenueReportUseCase,
    private readonly dashboard: DashboardReportUseCase,
    private readonly metrics: MetricsReportUseCase,
    private readonly appointmentsDetail: AppointmentsDetailUseCase,
  ) {}

  @Get('attendance')
  async attendance_(@Query() query: PeriodDto) {
    return this.attendance.execute(this.period(query));
  }

  @Get('services')
  async services_(@Query() query: PeriodDto) {
    return this.services.execute(this.period(query));
  }

  @Get('revenue')
  async revenue_(@Query() query: PeriodDto) {
    return this.revenue.execute(this.period(query));
  }

  @Get('appointments')
  async appointments_(@Query() query: PeriodDto) {
    return this.appointmentsDetail.execute(this.period(query));
  }

  @Get('dashboard')
  async dashboard_() {
    return this.dashboard.execute();
  }

  @Get('metrics')
  async metrics_(@Query() query: PeriodDto) {
    return this.metrics.execute(this.period(query));
  }

  /**
   * `from`/`to` podem chegar como `YYYY-MM-DD` (assistente, curl) ou ISO
   * completo (o app). Os helpers resolvem os dois em hora LOCAL — antes,
   * `new Date('2026-08-01')` virava meia-noite UTC e a janela inteira
   * escorregava um dia para tras, perdendo o ultimo dia do periodo pedido.
   */
  private period(query: PeriodDto): ReportPeriod {
    const to = fimDoDia(query.to ?? new Date());
    const from = query.from
      ? inicioDoDia(query.from)
      : new Date(to.getFullYear(), to.getMonth(), 1);

    return { from, to };
  }
}
