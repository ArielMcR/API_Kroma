import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAppointmentDto {
    @IsOptional()
    @IsNumber()
    companyId?: number;

    @IsOptional()
    @IsNumber()
    unitId?: number;

    @IsNotEmpty()
    @IsNumber()
    clientId!: number;

    @IsNotEmpty()
    @IsNumber()
    serviceId!: number;

    @IsNotEmpty()
    @IsNumber()
    professionalId!: number;

    @IsNotEmpty()
    @IsDateString()
    appointmentDate!: string;

    @IsNotEmpty()
    @IsString()
    startTime!: string;

    @IsNotEmpty()
    @IsString()
    endTime!: string;

    @IsNotEmpty()
    @IsString()
    status!: string;
}
