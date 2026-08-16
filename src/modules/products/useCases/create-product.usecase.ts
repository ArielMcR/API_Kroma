import { Inject, Injectable } from '@nestjs/common';
import type {
  ProductRepository,
  CreateProductData,
} from '../domain/product.repository';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(data: CreateProductData) {
    return this.productRepository.createProduct(data);
  }
}
