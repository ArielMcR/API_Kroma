import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateServiceDTO {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  durationMinutes!: number;

  @Exclude()
  userId?: number;
}
