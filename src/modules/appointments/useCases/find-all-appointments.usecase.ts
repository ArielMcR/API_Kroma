import { Inject, Injectable } from "@nestjs/common";
import type { AppointmentRepository } from "../domain/appointment.repository";

@Injectable()
export class FindAllAppointmentsUseCase {
    constructor(
        @Inject("AppointmentRepository")
        private readonly appointmentRepository: AppointmentRepository
    ) { }

    async execute(professionalId: number) {
        return this.appointmentRepository.getAllAppointments(professionalId);
    }
}
