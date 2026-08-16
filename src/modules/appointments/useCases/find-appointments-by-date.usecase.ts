import { Inject, Injectable } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';
import { AppointmentScheduleValidator } from '../domain/appointment-schedule.validator';

/**
 * Agenda da barbearia numa data. Diferente de FindAllAppointmentsUseCase, que
 * lista tudo de um profissional: aqui o recorte e o dia, para todos.
 */
@Injectable()
export class FindAppointmentsByDateUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(date: Date | string) {
    // Reaproveita o parser do validador para nao repetir o bug de fuso que ele
    // ja resolve: new Date("YYYY-MM-DD") e UTC e volta um dia em fuso negativo.
    const dia = AppointmentScheduleValidator.parseAppointmentDate(date);
    return this.appointmentRepository.getByDate(dia);
  }
}
