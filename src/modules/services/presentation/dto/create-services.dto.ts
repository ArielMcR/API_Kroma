import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateServiceDTO {
    @IsNotEmpty()
    @IsNumber()
    companyId!: number;

    @IsNotEmpty()
    @IsNumber()
    unitId!: number;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    @IsNumber()
    price!: number;

    @IsNotEmpty()
    @IsNumber()
    durationMinutes!: number;
}