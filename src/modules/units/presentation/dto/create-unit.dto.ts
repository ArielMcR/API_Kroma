import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUnitDto {
    @IsNotEmpty()
    @IsNumber()
    companyId!: number;

    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    address?: string | null;

    @IsOptional()
    @IsString()
    phone?: string | null;
}
