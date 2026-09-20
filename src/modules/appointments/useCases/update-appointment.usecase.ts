import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  AppointmentRepository,
  UpdateAppointmentData,
  UpdateAppointmentInput,
} from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import type { UserRepository } from 'src/modules/users/domain/user.repository';
import { AppointmentScheduleValidator } from '../domain/appointment-schedule.validator';
import { AppointmentServicesResolver } from '../domain/appointment-services.resolver';

@Injectable()
export class UpdateAppointmentUseCase {
  constructor(
    @Inject('AppointmentRepository')
    private readonly appointmentRepository: AppointmentRepository,
    @Inject('ServiceRepository')
    private readonly servicesRepository: ServicesRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: number, data: UpdateAppointmentInput) {
    const current = await this.appointmentRepository.getAppointmentById(id);
    if (!current) {
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    }

    // RF09: BARBER só edita os próprios agendamentos — ADMIN e SUPERVISOR
    // seguem livres. `data.userId` vem do JWT via InjectUserBodyInterceptor,
    // nunca é decidido pelo cliente.
    let editorEBarbeiro = false;
    if (data.userId) {
      const editor = await this.userRepository.getUserById(data.userId);
      editorEBarbeiro = editor?.role === 'BARBER';
      if (editorEBarbeiro && current.professionalId !== data.userId) {
        throw new HttpException(
          'Você só pode editar os próprios agendamentos.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const { serviceIds } = data;

    // RF07: cada profissional tem a própria agenda — BARBER não pode
    // transferir o atendimento para outro colega mandando professionalId.
    // Troca liberada só para SUPERVISOR/ADMIN.
    const professionalId = editorEBarbeiro
      ? current.professionalId
      : (data.professionalId ?? current.professionalId);
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

    // Projeção explícita dos campos aceitos pelo PATCH: nada de espalhar o
    // body inteiro no payload. Cancelamento e cobrança (`cancelledAt`,
    // `cancelledLate`, `chargeRegistered`, `chargeAmount`) e `status` nunca
    // vêm por aqui — quem escreve neles é o Cancel/CompleteAppointmentUseCase.
    const payload: UpdateAppointmentData = {
      ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
      professionalId,
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
