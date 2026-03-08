import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Product } from "../domain/product.entity";
import { ProductRepository, CreateProductData, UpdateProductData } from "../domain/product.repository";

@Injectable()
export class PrismaProductsRepository implements ProductRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createProduct(data: CreateProductData): Promise<Product> {
        return this.prisma.product.create({ data }) as Promise<Product>;
    }

    async updateProduct(id: number, data: UpdateProductData): Promise<Product> {
        return this.prisma.product.update({ where: { id }, data }) as Promise<Product>;
    }

    async deleteProduct(id: number): Promise<void> {
        await this.prisma.product.delete({ where: { id } });
    }

    async getProductById(id: number): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new HttpException('Product not found', 404);
        return product as Product;
    }

    async getAllProducts(unitId: number): Promise<Product[]> {
        return this.prisma.product.findMany({ where: { unitId } }) as Promise<Product[]>;
    }
}
