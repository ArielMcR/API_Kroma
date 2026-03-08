import { Inject, Injectable } from "@nestjs/common";
import type { AppointmentRepository, UpdateAppointmentData } from "../domain/appointment.repository";

@Injectable()
export class UpdateAppointmentUseCase {
    constructor(
        @Inject("AppointmentRepository")
        private readonly appointmentRepository: AppointmentRepository
    ) { }

    async execute(id: number, data: UpdateAppointmentData) {
        return this.appointmentRepository.updateAppointment(id, data);
    }
}
