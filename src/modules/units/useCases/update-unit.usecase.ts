import { Inject, Injectable } from "@nestjs/common";
import type { UnitRepository, UpdateUnitData } from "../domain/unit.repository";

@Injectable()
export class UpdateUnitUseCase {
    constructor(
        @Inject("UnitRepository")
        private readonly unitRepository: UnitRepository
    ) { }

    async execute(id: number, data: UpdateUnitData) {
        return this.unitRepository.updateUnit(id, data);
    }
}
