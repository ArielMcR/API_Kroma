import { Inject, Injectable } from "@nestjs/common";
import type { SaleRepository, CreateSaleData } from "../domain/sale.repository";

@Injectable()
export class CreateSaleUseCase {
    constructor(
        @Inject("SaleRepository")
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(data: CreateSaleData) {
        return this.saleRepository.createSale(data);
    }
}
