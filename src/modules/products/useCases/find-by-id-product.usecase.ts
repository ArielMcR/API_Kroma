import { Inject, Injectable } from '@nestjs/common';
import type { ProductRepository } from '../domain/product.repository';

@Injectable()
export class FindByIdProductUseCase {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: number) {
    return this.productRepository.getProductById(id);
  }
}
