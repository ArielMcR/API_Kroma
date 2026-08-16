import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import { AppointmentScheduleValidator } from '../domain/appointment-schedule.validator';
import { AppointmentServicesResolver } from '../domain/appointment-services.resolver';

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
    @Inject('ServiceRepository')
    private readonly servicesRepository: ServicesRepository,
  ) {}

  async execute(data: CreateAppointmentData) {
    const appointmentDate = AppointmentScheduleValidator.parseAppointmentDate(
      data.appointmentDate,
    );

    const services = await AppointmentServicesResolver.resolve(
      this.servicesRepository,
      data.serviceIds,
    );

    const durationMinutes =
      AppointmentServicesResolver.totalDuration(services);

    const endTime = AppointmentServicesResolver.calculateEndTime(
      data.startTime,
      durationMinutes,
    );

    AppointmentScheduleValidator.validateAdvance(appointmentDate);
    AppointmentScheduleValidator.validate(
      appointmentDate,
      data.startTime,
      endTime,
    );

    const conflicts = await this.appointmentRepository.findConflicting(
      data.professionalId,
      appointmentDate,
      data.startTime,
      endTime,
    );

    if (conflicts.length > 0) {
      throw new HttpException(
        'Já existe um agendamento neste horário',
        HttpStatus.CONFLICT,
      );
    }

    const { serviceIds: _ignorado, ...resto } = data;

    return this.appointmentRepository.createAppointment({
      ...resto,
      appointmentDate,
      endTime,
      durationMinutes,
      services,
    });
  }
}
