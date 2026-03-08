import { Inject, Injectable } from "@nestjs/common";
import type { AppointmentRepository, CreateAppointmentData } from "../domain/appointment.repository";

@Injectable()
export class CreateAppointmentUseCase {
    constructor(
        @Inject("AppointmentRepository")
        private readonly appointmentRepository: AppointmentRepository
    ) { }

    async execute(data: CreateAppointmentData) {
        return this.appointmentRepository.createAppointment(data);
    }
}
