import { Unit } from "./unit.entity";

export type CreateUnitData = {
    companyId: number;
    name: string;
    address?: string | null;
    phone?: string | null;
}

export type UpdateUnitData = Partial<CreateUnitData>;

export interface UnitRepository {
    createUnit(data: CreateUnitData): Promise<Unit>;
    updateUnit(id: number, data: UpdateUnitData): Promise<Unit>;
    deleteUnit(id: number): Promise<void>;
    getUnitById(id: number): Promise<Unit | null>;
    getAllUnits(companyId?: number): Promise<Unit[]>;
}
