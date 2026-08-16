import { Inject, Injectable } from '@nestjs/common';
import type { SaleRepository } from '../domain/sale.repository';

@Injectable()
export class FindByIdSaleUseCase {
  constructor(
    @Inject('SaleRepository')
    private readonly saleRepository: SaleRepository,
  ) {}

  async execute(id: number) {
    return this.saleRepository.getSaleById(id);
  }
}
