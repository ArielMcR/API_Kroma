import { Default } from "src/modules/common/domain/default/default.domain";

export class Client extends Default {
    id!: number;
    companyId?: number | null;
    unitId?: number | null;
    name!: string;
    lastName?: string | null;
    cellPhone!: string;
    email?: string;

}