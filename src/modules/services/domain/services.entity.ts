import { Default } from "src/modules/common/domain/default/default.domain";

export class Service extends Default {
    id!: number;
    companyId!: number;
    unitId!: number;
    name!: string;
    price!: number;
    durationMinutes!: number;
}

