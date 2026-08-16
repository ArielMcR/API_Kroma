import { Sale } from './sale.entity';

export type CreateSaleItemData = {
  productId: number;
  quantity: number;
};

export type CreateSaleData = {
  clientId?: number | null;
  paymentMethod: string;
  items: CreateSaleItemData[];
};

export interface SaleRepository {
  createSale(data: CreateSaleData): Promise<Sale>;
  getSaleById(id: number): Promise<Sale | null>;
  getAllSales(): Promise<Sale[]>;
  deleteSale(id: number): Promise<void>;
}
