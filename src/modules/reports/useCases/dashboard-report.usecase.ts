import { Inject, Injectable } from '@nestjs/common';
import type { ReportRepository } from '../domain/report.repository';

@Injectable()
export class DashboardReportUseCase {
  constructor(
    @Inject('ReportRepository')
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute() {
    return this.reportRepository.getDashboard();
  }
}
