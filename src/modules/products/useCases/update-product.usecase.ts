import { Inject, Injectable } from '@nestjs/common';
import type {
  ProductRepository,
  UpdateProductData,
} from '../domain/product.repository';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number, data: UpdateProductData) {
    return this.productRepository.updateProduct(id, data);
  }
}
