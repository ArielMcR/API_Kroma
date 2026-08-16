import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './presentation/controller/reports.controller';
import { PrismaReportsRepository } from './infra/prisma-reports';
import { AttendanceReportUseCase } from './useCases/attendance-report.usecase';
import { ServicesReportUseCase } from './useCases/services-report.usecase';
import { RevenueReportUseCase } from './useCases/revenue-report.usecase';
import { DashboardReportUseCase } from './useCases/dashboard-report.usecase';
import { MetricsReportUseCase } from './useCases/metrics-report.usecase';
import { AppointmentsDetailUseCase } from './useCases/appointments-detail.usecase';

@Module({
  controllers: [ReportsController],
  providers: [
    AttendanceReportUseCase,
    ServicesReportUseCase,
    RevenueReportUseCase,
    DashboardReportUseCase,
    MetricsReportUseCase,
    AppointmentsDetailUseCase,
    { provide: 'ReportRepository', useClass: PrismaReportsRepository },
  ],
  imports: [PrismaModule, AuthModule],
  // Consumidos pelo AssistantModule (Sprint 3) no GENERATE_REPORT.
  exports: [
    AttendanceReportUseCase,
    RevenueReportUseCase,
    ServicesReportUseCase,
  ],
})
export class ReportsModule {}
