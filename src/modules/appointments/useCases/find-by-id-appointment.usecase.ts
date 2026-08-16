import { Inject, Injectable } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';

@Injectable()
export class FindByIdAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(id: number) {
    return this.appointmentRepository.getAppointmentById(id);
  }
}
