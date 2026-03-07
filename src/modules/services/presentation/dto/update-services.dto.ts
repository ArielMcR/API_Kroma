import { PartialType } from "@nestjs/mapped-types";
import { CreateServiceDTO } from "./create-services.dto";

export class UpdateServiceDTO extends PartialType(CreateServiceDTO) {
    
}