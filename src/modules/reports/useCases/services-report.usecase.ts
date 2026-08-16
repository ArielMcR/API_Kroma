import { Inject, Injectable } from '@nestjs/common';
import type {
  ReportPeriod,
  ReportRepository,
} from '../domain/report.repository';

@Injectable()
export class ServicesReportUseCase {
  constructor(
    @Inject('ReportRepository')
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(period: ReportPeriod) {
    return this.reportRepository.getServicesReport(period);
  }
}
