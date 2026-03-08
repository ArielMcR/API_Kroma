import { Inject, Injectable } from "@nestjs/common";
import type { SaleRepository } from "../domain/sale.repository";

@Injectable()
export class DeleteSaleUseCase {
    constructor(
        @Inject("SaleRepository")
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(id: number): Promise<void> {
        return this.saleRepository.deleteSale(id);
    }
}
