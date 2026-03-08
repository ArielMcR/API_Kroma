import { Default } from "src/modules/common/domain/default/default.domain";

export class Unit extends Default {
    id!: number;
    companyId!: number;
    name!: string;
    address?: string | null;
    phone?: string | null;
}
