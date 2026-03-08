import { Inject, Injectable } from "@nestjs/common";
import type { ProductRepository } from "../domain/product.repository";

@Injectable()
export class FindAllProductsUseCase {
    constructor(
        @Inject("ProductRepository")
        private readonly productRepository: ProductRepository
    ) { }

    async execute(unitId: number) {
        return this.productRepository.getAllProducts(unitId);
    }
}
