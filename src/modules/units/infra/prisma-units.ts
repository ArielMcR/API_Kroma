import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Unit } from "../domain/unit.entity";
import { UnitRepository, CreateUnitData, UpdateUnitData } from "../domain/unit.repository";

@Injectable()
export class PrismaUnitsRepository implements UnitRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createUnit(data: CreateUnitData): Promise<Unit> {
        return this.prisma.unit.create({ data }) as Promise<Unit>;
    }

    async updateUnit(id: number, data: UpdateUnitData): Promise<Unit> {
        return this.prisma.unit.update({ where: { id }, data }) as Promise<Unit>;
    }

    async deleteUnit(id: number): Promise<void> {
        await this.prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    async getUnitById(id: number): Promise<Unit | null> {
        const unit = await this.prisma.unit.findUnique({ where: { id, deletedAt: null } });
        if (!unit) throw new HttpException('Unit not found', 404);
        return unit as Unit;
    }

    async getAllUnits(companyId?: number): Promise<Unit[]> {
        return this.prisma.unit.findMany({
            where: { deletedAt: null, ...(companyId ? { companyId } : {}) },
        }) as Promise<Unit[]>;
    }
}
