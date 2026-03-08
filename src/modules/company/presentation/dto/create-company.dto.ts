import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCompanyDto {
    @IsNotEmpty()
    @IsString()
    tradeName!: string;

    @IsNotEmpty()
    @IsString()
    legalName!: string;

    @IsNotEmpty()
    @IsString()
    cnpj!: string;

    @IsOptional()
    @IsString()
    plan?: string | null;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
