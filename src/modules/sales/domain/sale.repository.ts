import { Sale } from "./sale.entity";

export type CreateSaleItemData = {
    productId: number;
    quantity: number;
}

export type CreateSaleData = {
    unitId: number;
    clientId?: number | null;
    paymentMethod: string;
    items: CreateSaleItemData[];
}

export interface SaleRepository {
    createSale(data: CreateSaleData): Promise<Sale>;
    getSaleById(id: number): Promise<Sale | null>;
    getAllSales(unitId: number): Promise<Sale[]>;
    deleteSale(id: number): Promise<void>;
}
