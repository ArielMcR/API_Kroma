import { Inject, Injectable } from "@nestjs/common";
import type { ProductRepository } from "../domain/product.repository";

@Injectable()
export class DeleteProductUseCase {
    constructor(
        @Inject("ProductRepository")
        private readonly productRepository: ProductRepository
    ) { }

    async execute(id: number): Promise<void> {
        return this.productRepository.deleteProduct(id);
    }
}
