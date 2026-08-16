import { Default } from 'src/modules/common/domain/default/default.domain';

/**
 * Servico dentro de um agendamento, com preco e duracao CONGELADOS na marcacao.
 * Reajustar o cadastro do servico depois nao altera atendimentos ja feitos.
 */
export class AppointmentServiceItem {
  id!: number;
  appointmentId!: number;
  serviceId!: number;
  unitPrice!: number;
  durationMinutes!: number;
  position!: number;
  service?: { id: number; name: string };
}

export class Appointment extends Default {
  id!: number;
  clientId!: number;
  professionalId!: number;
  appointmentDate!: Date;
  startTime!: string;
  endTime!: string;
  status!: string;
  /** Soma das duracoes de `services`. */
  durationMinutes!: number;

  services!: AppointmentServiceItem[];

  cancelledAt?: Date | null;
  cancelledLate!: boolean;
  chargeRegistered!: boolean;
  chargeAmount?: number | null;
}

/** Valor total do atendimento: soma dos precos congelados. */
export const valorTotal = (
  services: Pick<AppointmentServiceItem, 'unitPrice'>[],
): number => services.reduce((total, s) => total + s.unitPrice, 0);

/** Duracao total do atendimento: soma das duracoes congeladas. */
export const duracaoTotal = (
  services: Pick<AppointmentServiceItem, 'durationMinutes'>[],
): number => services.reduce((total, s) => total + s.durationMinutes, 0);
