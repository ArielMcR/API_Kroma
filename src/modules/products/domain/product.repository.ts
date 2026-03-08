import { Product } from "./product.entity";

export type CreateProductData = {
    unitId: number;
    name: string;
    unitPrice: number;
    profitPercentage: number;
    salePrice: number;
    stock?: number | null;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface ProductRepository {
    createProduct(data: CreateProductData): Promise<Product>;
    updateProduct(id: number, data: UpdateProductData): Promise<Product>;
    deleteProduct(id: number): Promise<void>;
    getProductById(id: number): Promise<Product | null>;
    getAllProducts(unitId: number): Promise<Product[]>;
}
