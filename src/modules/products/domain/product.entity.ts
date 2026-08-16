export class Product {
  id!: number;
  name!: string;
  unitPrice!: number;
  profitPercentage!: number;
  salePrice!: number;
  stock?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}
