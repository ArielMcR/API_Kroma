import { Default } from "src/modules/common/domain/default/default.domain";

export class Appointment extends Default {
    id!: number;
    companyId!: number;
    unitId!: number;
    clientId!: number;
    serviceId!: number;
    professionalId!: number;
    appointmentDate!: Date;
    startTime!: string;
    endTime!: string;
    status!: string;
}
