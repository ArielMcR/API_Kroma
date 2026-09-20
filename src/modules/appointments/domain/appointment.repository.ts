import { Appointment } from './appointment.entity';

/** Servico ja resolvido, com preco e duracao a congelar. */
export type AppointmentServiceInput = {
  serviceId: number;
  unitPrice: number;
  durationMinutes: number;
  position: number;
};

export type CreateAppointmentData = {
  clientId: number;
  /** 1..N servicos. A duracao do atendimento e a soma das duracoes. */
  serviceIds: number[];
  professionalId: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: string;
  durationMinutes?: number;
};

/** O que o repositorio realmente persiste, ja com os precos resolvidos. */
export type PersistAppointmentData = Omit<
  CreateAppointmentData,
  'serviceIds'
> & {
  services: AppointmentServiceInput[];
  durationMinutes: number;
};

export type UpdateAppointmentData = Partial<
  Omit<CreateAppointmentData, 'serviceIds'>
> & {
  /** Quando presente, substitui a lista inteira de servicos. */
  services?: AppointmentServiceInput[];
  cancelledAt?: Date | null;
  cancelledLate?: boolean;
  chargeRegistered?: boolean;
  chargeAmount?: number | null;
};

/**
 * O que o use case de update recebe da API: `serviceIds` crus. O repositorio
 * NAO conhece esse campo — quem o traduz em `services` (com preco congelado) e
 * o `UpdateAppointmentUseCase`. Mandar `serviceIds` direto ao Prisma quebra a
 * escrita, porque nao existe coluna com esse nome.
 */
export type UpdateAppointmentInput = Omit<UpdateAppointmentData, 'services'> & {
  serviceIds?: number[];
  /**
   * Injetado pelo InjectUserBodyInterceptor a partir do JWT — nunca confiar
   * num valor mandado pelo cliente. Usado só para checar se um BARBER está
   * editando o próprio agendamento; não é persistido.
   */
  userId?: number;
};

export interface AppointmentRepository {
  createAppointment(data: PersistAppointmentData): Promise<Appointment>;
  updateAppointment(
    id: number,
    data: UpdateAppointmentData,
  ): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  getAppointmentById(id: number): Promise<Appointment | null>;
  getAllAppointments(professionalId: number): Promise<Appointment[]>;
  /**
   * Agendamentos da barbearia inteira numa data — sem filtrar por profissional.
   * Usado pelo assistente (Sprint 3): "quais sao os agendamentos de amanha?"
   * pergunta pela agenda da casa, nao pela do usuario que digitou.
   */
  getByDate(date: Date): Promise<Appointment[]>;
  findConflicting(
    professionalId: number,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<Appointment[]>;
}
