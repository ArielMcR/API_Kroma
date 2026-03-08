import { Inject, Injectable } from "@nestjs/common";
import type { UnitRepository } from "../domain/unit.repository";

@Injectable()
export class DeleteUnitUseCase {
    constructor(
        @Inject("UnitRepository")
        private readonly unitRepository: UnitRepository
    ) { }

    async execute(id: number): Promise<void> {
        return this.unitRepository.deleteUnit(id);
    }
}
