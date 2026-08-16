import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';

@Injectable()
export class CompleteAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(id: number) {
    const appointment = await this.appointmentRepository.getAppointmentById(id);
    if (!appointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    return this.appointmentRepository.updateAppointment(id, {
      status: 'COMPLETED',
    });
  }
}
