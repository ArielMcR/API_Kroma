import { Inject, Injectable } from "@nestjs/common";
import type { UnitRepository } from "../domain/unit.repository";

@Injectable()
export class FindAllUnitsUseCase {
    constructor(
        @Inject("UnitRepository")
        private readonly unitRepository: UnitRepository
    ) { }

    async execute(companyId?: number) {
        return this.unitRepository.getAllUnits(companyId);
    }
}
