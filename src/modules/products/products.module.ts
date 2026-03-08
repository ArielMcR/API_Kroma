import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsController } from './presentation/controller/products.controller';
import { PrismaProductsRepository } from './infra/prisma-products';
import { CreateProductUseCase } from './useCases/create-product.usecase';
import { UpdateProductUseCase } from './useCases/update-product.usecase';
import { DeleteProductUseCase } from './useCases/delete-product.usecase';
import { FindAllProductsUseCase } from './useCases/find-all-products.usecase';
import { FindByIdProductUseCase } from './useCases/find-by-id-product.usecase';

@Module({
    controllers: [ProductsController],
    providers: [
        CreateProductUseCase,
        UpdateProductUseCase,
        DeleteProductUseCase,
        FindAllProductsUseCase,
        FindByIdProductUseCase,
        { provide: 'ProductRepository', useClass: PrismaProductsRepository },
    ],
    imports: [PrismaModule, AuthModule],
})
export class ProductsModule { }
