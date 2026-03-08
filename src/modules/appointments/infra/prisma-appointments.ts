import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Appointment } from "../domain/appointment.entity";
import { AppointmentRepository, CreateAppointmentData, UpdateAppointmentData } from "../domain/appointment.repository";

@Injectable()
export class PrismaAppointmentsRepository implements AppointmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
        return this.prisma.appointment.create({ data }) as Promise<Appointment>;
    }

    async updateAppointment(id: number, data: UpdateAppointmentData): Promise<Appointment> {
        return this.prisma.appointment.update({ where: { id }, data }) as Promise<Appointment>;
    }

    async deleteAppointment(id: number): Promise<void> {
        await this.prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    async getAppointmentById(id: number): Promise<Appointment | null> {
        const appointment = await this.prisma.appointment.findUnique({ where: { id, deletedAt: null } });
        if (!appointment) throw new HttpException('Appointment not found', 404);
        return appointment as Appointment;
    }

    async getAllAppointments(professionalId: number): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: { professionalId, deletedAt: null },
        }) as Promise<Appointment[]>;
    }
}
