import { Inject, Injectable } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';

@Injectable()
export class DeleteAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(id: number): Promise<void> {
    return this.appointmentRepository.deleteAppointment(id);
  }
}
