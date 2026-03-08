import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsNumber()
    companyId?: number;

    @IsOptional()
    @IsNumber()
    unitId?: number;
}
