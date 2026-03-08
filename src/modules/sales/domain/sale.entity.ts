export class SaleItem {
    id!: number;
    saleId!: number;
    productId!: number;
    quantity!: number;
    unitPrice!: number;
    totalAmount!: number;
}

export class Sale {
    id!: number;
    unitId!: number;
    clientId?: number | null;
    saleDate!: Date;
    totalAmount!: number;
    paymentMethod!: string;
    items?: SaleItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
