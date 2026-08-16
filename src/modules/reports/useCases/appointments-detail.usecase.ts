import { Inject, Injectable } from '@nestjs/common';
import type {
  ReportPeriod,
  ReportRepository,
} from '../domain/report.repository';

/**
 * Lista os agendamentos do periodo, item a item — o detalhamento por tras dos
 * numeros agregados. Devolve todos os status; filtrar e decisao da tela.
 */
@Injectable()
export class AppointmentsDetailUseCase {
  constructor(
    @Inject('ReportRepository')
    private readonly reportRepository: ReportRepository,
  ) {}

  async execute(period: ReportPeriod) {
    return this.reportRepository.getAppointmentsDetail(period);
  }
}
