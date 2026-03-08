import { Inject, Injectable } from "@nestjs/common";
import type { SaleRepository } from "../domain/sale.repository";

@Injectable()
export class FindAllSalesUseCase {
    constructor(
        @Inject("SaleRepository")
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(unitId: number) {
        return this.saleRepository.getAllSales(unitId);
    }
}
