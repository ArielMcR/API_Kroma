import { Appointment } from "./appointment.entity";

export type CreateAppointmentData = {
    companyId: number;
    unitId: number;
    clientId: number;
    serviceId: number;
    professionalId: number;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    status: string;
}

export type UpdateAppointmentData = Partial<CreateAppointmentData>;

export interface AppointmentRepository {
    createAppointment(data: CreateAppointmentData): Promise<Appointment>;
    updateAppointment(id: number, data: UpdateAppointmentData): Promise<Appointment>;
    deleteAppointment(id: number): Promise<void>;
    getAppointmentById(id: number): Promise<Appointment | null>;
    getAllAppointments(professionalId: number): Promise<Appointment[]>;
}
