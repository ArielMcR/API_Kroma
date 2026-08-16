import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';
import { Product } from '../domain/product.entity';
import {
  ProductRepository,
  CreateProductData,
  UpdateProductData,
} from '../domain/product.repository';

@Injectable()
export class PrismaProductsRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      // Projecao explicita: o InjectUserBodyInterceptor injeta `userId` em todo
      // body autenticado e `Product` nao tem essa coluna — repassar o body
      // inteiro derruba a escrita com PrismaClientValidationError.
      const { name, unitPrice, profitPercentage, salePrice, stock } = data;
      return (await this.prisma.product.create({
        data: { name, unitPrice, profitPercentage, salePrice, stock },
      })) as Product;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
    try {
      const { name, unitPrice, profitPercentage, salePrice, stock } = data;
      return (await this.prisma.product.update({
        where: { id },
        data: { name, unitPrice, profitPercentage, salePrice, stock },
      })) as Product;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product)
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    return product as Product;
  }

  async getAllProducts(): Promise<Product[]> {
    return this.prisma.product.findMany() as Promise<Product[]>;
  }
}
