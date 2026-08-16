import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsNumber()
  clientId!: number;

  /** 1..N serviços. A duração do atendimento é a soma das durações. */
  @IsArray()
  @ArrayNotEmpty({ message: 'Informe ao menos um serviço' })
  @IsInt({ each: true })
  serviceIds!: number[];

  @IsNotEmpty()
  @IsNumber()
  professionalId!: number;

  @IsNotEmpty()
  @IsDateString()
  appointmentDate!: string;

  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsNotEmpty()
  @IsString()
  status!: string;
}
