import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  AppointmentRepository,
  UpdateAppointmentData,
  UpdateAppointmentInput,
} from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import { AppointmentScheduleValidator } from '../domain/appointment-schedule.validator';
import { AppointmentServicesResolver } from '../domain/appointment-services.resolver';

@Injectable()
export class UpdateAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
    @Inject('ServiceRepository')
    private readonly servicesRepository: ServicesRepository,
  ) {}

  async execute(id: number, data: UpdateAppointmentInput) {
    const current = await this.appointmentRepository.getAppointmentById(id);
    if (!current) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    // `serviceIds` nao vai adiante: o repositorio persiste `services`.
    const { serviceIds, endTime: _endTimeIgnorado, ...resto } = data;

    const professionalId = data.professionalId ?? current.professionalId;
    const appointmentDate = data.appointmentDate
      ? AppointmentScheduleValidator.parseAppointmentDate(data.appointmentDate)
      : current.appointmentDate;
    const startTime = data.startTime ?? current.startTime;

    // Trocar o servico troca a duracao do atendimento, e a duracao e que
    // define o endTime — por isso o endTime enviado pelo cliente e ignorado
    // (era ele que deixava a agenda ocupar um numero de slots errado).
    const services = serviceIds
      ? await AppointmentServicesResolver.resolve(
          this.servicesRepository,
          serviceIds,
        )
      : undefined;

    const durationMinutes = services
      ? AppointmentServicesResolver.totalDuration(services)
      : this.duracaoAtual(current);

    const endTime = AppointmentServicesResolver.calculateEndTime(
      startTime,
      durationMinutes,
    );

    AppointmentScheduleValidator.validate(appointmentDate, startTime, endTime);

    const conflicts = await this.appointmentRepository.findConflicting(
      professionalId,
      appointmentDate,
      startTime,
      endTime,
      id,
    );

    if (conflicts.length > 0) {
      throw new HttpException(
        'Já existe um agendamento neste horário',
        HttpStatus.CONFLICT,
      );
    }

    const payload: UpdateAppointmentData = {
      ...resto,
      appointmentDate,
      startTime,
      endTime,
      durationMinutes,
      ...(services ? { services } : {}),
    };

    return this.appointmentRepository.updateAppointment(id, payload);
  }

  /**
   * Registros antigos podem ter `durationMinutes` nulo; a soma dos itens e a
   * fonte de verdade nesse caso.
   */
  private duracaoAtual(current: {
    durationMinutes?: number | null;
    services?: { durationMinutes: number }[];
  }): number {
    if (current.durationMinutes) return current.durationMinutes;
    return (current.services ?? []).reduce(
      (total, s) => total + s.durationMinutes,
      0,
    );
  }
}
