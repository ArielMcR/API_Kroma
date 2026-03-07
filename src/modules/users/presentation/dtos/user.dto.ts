import { IsNotEmpty, IsNumber } from "class-validator";

export class UserDTO {
    @IsNotEmpty({
        message: "O campo companyId é obrigatório"
    })
    @IsNumber()
    companyId!: number;
    @IsNotEmpty({
        message: "O campo unitId é obrigatório"
    })
    @IsNumber()
    unitId!: number;
    @IsNotEmpty({
        message: "O campo userId é obrigatório"
    })
    @IsNumber()
    userId!: number;

    email?: string;
}