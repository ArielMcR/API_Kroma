import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Sale } from "../domain/sale.entity";
import { SaleRepository, CreateSaleData } from "../domain/sale.repository";

@Injectable()
export class PrismaSalesRepository implements SaleRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createSale(data: CreateSaleData): Promise<Sale> {
        const productIds = data.items.map(i => i.productId);
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

        const productMap = new Map(products.map(p => [p.id, p]));

        const saleItems = data.items.map(item => {
            const product = productMap.get(item.productId);
            if (!product) throw new HttpException(`Product ${item.productId} not found`, 404);
            const unitPrice = product.salePrice;
            return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                totalAmount: unitPrice * item.quantity,
            };
        });

        const totalAmount = saleItems.reduce((sum, i) => sum + i.totalAmount, 0);

        return this.prisma.sale.create({
            data: {
                unitId: data.unitId,
                clientId: data.clientId ?? null,
                paymentMethod: data.paymentMethod,
                totalAmount,
                items: { create: saleItems },
            },
            include: { items: true },
        }) as Promise<Sale>;
    }

    async getSaleById(id: number): Promise<Sale | null> {
        const sale = await this.prisma.sale.findUnique({ where: { id }, include: { items: true } });
        if (!sale) throw new HttpException('Sale not found', 404);
        return sale as Sale;
    }

    async getAllSales(unitId: number): Promise<Sale[]> {
        return this.prisma.sale.findMany({ where: { unitId }, include: { items: true } }) as Promise<Sale[]>;
    }

    async deleteSale(id: number): Promise<void> {
        await this.prisma.sale.delete({ where: { id } });
    }
}
