import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDTO {
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório.' })
  @IsString({ message: 'O nome do cliente deve ser uma string.' })
  name!: string;
  @IsOptional()
  @IsString({ message: 'O sobrenome do cliente deve ser uma string.' })
  lastName?: string | null;
  @IsNotEmpty({ message: 'O celular do cliente é obrigatório.' })
  @IsString({ message: 'O celular do cliente deve ser uma string.' })
  cellPhone!: string;
}
