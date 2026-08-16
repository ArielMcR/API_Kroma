import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';
import { Appointment } from '../domain/appointment.entity';
import {
  AppointmentRepository,
  PersistAppointmentData,
  UpdateAppointmentData,
} from '../domain/appointment.repository';

/** Os servicos acompanham o agendamento em toda leitura — sem eles não há valor nem duração. */
const INCLUDE_SERVICOS = {
  services: {
    include: { service: { select: { id: true, name: true } } },
    orderBy: { position: 'asc' },
  },
} as const;

@Injectable()
export class PrismaAppointmentsRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAppointment(data: PersistAppointmentData): Promise<Appointment> {
    try {
      delete (data as any).userId;
      const { services, ...agendamento } = data;

      return (await this.prisma.appointment.create({
        data: {
          ...agendamento,
          // Nested create: agendamento e itens numa transacao so, para nao
          // existir agendamento sem servico nem que por um instante.
          services: { create: services },
        },
        include: INCLUDE_SERVICOS,
      })) as unknown as Appointment;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateAppointment(
    id: number,
    data: UpdateAppointmentData,
  ): Promise<Appointment> {
    try {
      delete (data as any).userId;
      const { services, ...agendamento } = data;

      return (await this.prisma.appointment.update({
        where: { id },
        data: {
          ...agendamento,
          // Trocar servico e substituir a lista inteira: apagar e recriar
          // mantem `position` coerente sem ter que diferenciar item a item.
          ...(services
            ? { services: { deleteMany: {}, create: services } }
            : {}),
        },
        include: INCLUDE_SERVICOS,
      })) as unknown as Appointment;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    try {
      await this.prisma.appointment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE_SERVICOS,
    });
    if (!appointment)
      throw new HttpException('Appointment not found', HttpStatus.NOT_FOUND);
    return appointment as Appointment;
  }

  async getAllAppointments(professionalId: number): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { professionalId, deletedAt: null },
      include: { client: true, ...INCLUDE_SERVICOS },
    }) as Promise<Appointment[]>;
  }

  /**
   * Limites do dia local de uma data. `appointmentDate` e DateTime e a tabela
   * ja tem registros gravados com hora diferente de 00:00 — comparar por
   * igualdade faz esses registros sumirem das consultas.
   */
  private limitesDoDia(date: Date): { inicio: Date; fim: Date } {
    return {
      inicio: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0,
      ),
      fim: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      ),
    };
  }

  async getByDate(date: Date): Promise<Appointment[]> {
    const { inicio, fim } = this.limitesDoDia(date);

    return this.prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: inicio, lte: fim },
        deletedAt: null,
        status: { not: 'CANCELLED' },
      },
      include: { client: true, professional: true, ...INCLUDE_SERVICOS },
      orderBy: { startTime: 'asc' },
    }) as Promise<Appointment[]>;
  }

  async findConflicting(
    professionalId: number,
    appointmentDate: Date,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<Appointment[]> {
    // Antes comparava `appointmentDate` por igualdade. Como a coluna guarda
    // DateTime e existem registros com hora embutida, um agendamento gravado
    // as 09:30 nunca colidia com outro gravado a meia-noite do mesmo dia — o
    // conflito passava batido e dois clientes ficavam no mesmo horario.
    const { inicio, fim } = this.limitesDoDia(appointmentDate);

    return this.prisma.appointment.findMany({
      where: {
        professionalId,
        appointmentDate: { gte: inicio, lte: fim },
        deletedAt: null,
        status: { not: 'CANCELLED' },
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    }) as Promise<Appointment[]>;
  }
}
