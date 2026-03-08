import { Inject, Injectable } from "@nestjs/common";
import type { UnitRepository } from "../domain/unit.repository";

@Injectable()
export class FindByIdUnitUseCase {
    constructor(
        @Inject("UnitRepository")
        private readonly unitRepository: UnitRepository
    ) { }

    async execute(id: number) {
        return this.unitRepository.getUnitById(id);
    }
}
