import { Inject, Injectable } from "@nestjs/common";
import type { UnitRepository, CreateUnitData } from "../domain/unit.repository";

@Injectable()
export class CreateUnitUseCase {
    constructor(
        @Inject("UnitRepository")
        private readonly unitRepository: UnitRepository
    ) { }

    async execute(data: CreateUnitData) {
        return this.unitRepository.createUnit(data);
    }
}
