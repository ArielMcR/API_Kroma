import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from "class-validator";
import { CreateUserDTO } from "./create-user.dto";

export class UpdateUserDTO extends PartialType(CreateUserDTO) {
    @IsOptional()
    readonly active: boolean;
}