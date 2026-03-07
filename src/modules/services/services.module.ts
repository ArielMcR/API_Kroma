import { Module } from '@nestjs/common';
import { ServicesController } from './presentation/controller/services.controller';
import { CreateServiceUseCase } from './useCases/create-service.usecase';
import { UpdateServiceUseCase } from './useCases/update-service.usecase';
import { DeleteServiceUseCase } from './useCases/delete-service.usecase';
import { FindByIdServiceUseCase } from './useCases/find-by-id-service.usecase';
import { PrismaServiceRepository } from './infra/prisma-service';
import { FindAllServicesUseCase } from './useCases/find-all-services.usecase';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    controllers: [ServicesController],
    providers: [
        CreateServiceUseCase,
        UpdateServiceUseCase,
        DeleteServiceUseCase,
        FindByIdServiceUseCase,
        FindAllServicesUseCase,
        { provide: "ServiceRepository", useClass: PrismaServiceRepository }
    ],
    imports: [PrismaModule, AuthModule],
})
export class ServicesModule { }
