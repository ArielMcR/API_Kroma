import { IsOptional, IsDateString } from 'class-validator';

export class PeriodDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
