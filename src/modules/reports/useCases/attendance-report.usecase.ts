import { Inject, Injectable } from '@nestjs/common';
import type {
  ReportPeriod,
  ReportRepository,
} from '../domain/report.repository';

@Injectable()
export class AttendanceReportUseCase {
  constructor(
    @Inject('ReportRepository')
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(period: ReportPeriod) {
    return this.reportRepository.getAttendanceReport(period);
  }
}
