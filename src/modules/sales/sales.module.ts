import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SalesController } from './presentation/controller/sales.controller';
import { PrismaSalesRepository } from './infra/prisma-sales';
import { CreateSaleUseCase } from './useCases/create-sale.usecase';
import { DeleteSaleUseCase } from './useCases/delete-sale.usecase';
import { FindAllSalesUseCase } from './useCases/find-all-sales.usecase';
import { FindByIdSaleUseCase } from './useCases/find-by-id-sale.usecase';

@Module({
  controllers: [SalesController],
  providers: [
    CreateSaleUseCase,
    DeleteSaleUseCase,
    FindAllSalesUseCase,
    FindByIdSaleUseCase,
    { provide: 'SaleRepository', useClass: PrismaSalesRepository },
  ],
  imports: [PrismaModule, AuthModule],
})
export class SalesModule {}
