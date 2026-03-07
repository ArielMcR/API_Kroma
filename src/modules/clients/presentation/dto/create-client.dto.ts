import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateClientDTO {
    @IsNotEmpty({ message: "O nome do cliente é obrigatório." })
    @IsString({ message: "O nome do cliente deve ser uma string." })
    name!: string;
    @IsNotEmpty({ message: "O sobrenome do cliente é obrigatório." })
    @IsString({ message: "O sobrenome do cliente deve ser uma string." })
    lastName?: string | null;
    @IsNotEmpty({ message: "O celular do cliente é obrigatório." })
    @IsString({ message: "O celular do cliente deve ser uma string." })
    cellPhone!: string;
    @IsNotEmpty({ message: "O ID da empresa é obrigatório." })
    @IsNumber({}, { message: "O ID da empresa deve ser um número." })
    companyId?: number | null;
    @IsNotEmpty({ message: "O ID da unidade é obrigatório." })
    @IsNumber({}, { message: "O ID da unidade deve ser um número." })
    unitId?: number | null;
}