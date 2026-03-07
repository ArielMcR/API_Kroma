import { PartialType } from "@nestjs/mapped-types";
import { ServiceData } from "./service.data";

export class UpdateServiceData extends PartialType(ServiceData) { }