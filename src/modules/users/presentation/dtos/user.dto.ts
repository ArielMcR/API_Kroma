import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserDTO {
  @IsNotEmpty({
    message: 'O campo userId é obrigatório',
  })
  @IsNumber()
  userId!: number;

  email?: string;
}
