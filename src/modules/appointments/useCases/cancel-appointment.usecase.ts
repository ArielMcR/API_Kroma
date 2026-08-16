import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';
import { valorTotal } from '../domain/appointment.entity';

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
  ) {}

  async execute(id: number) {
    const appointment = await this.appointmentRepository.getAppointmentById(id);
    if (!appointment) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    const now = new Date();
    const appointmentDateTime = this.combineDateTime(
      appointment.appointmentDate,
      appointment.startTime,
    );

    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const cancelledLate = diffHours < 1;

    let chargeAmount: number | null = null;
    if (cancelledLate) {
      // Multa sobre o valor total do atendimento, e usando os precos
      // congelados no agendamento — nao o preco atual do cadastro.
      chargeAmount = valorTotal(appointment.services ?? []);
    }

    return this.appointmentRepository.updateAppointment(id, {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledLate,
      chargeRegistered: cancelledLate,
      chargeAmount,
    });
  }

  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }
}
