import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UnitsController } from './presentation/controller/units.controller';
import { PrismaUnitsRepository } from './infra/prisma-units';
import { CreateUnitUseCase } from './useCases/create-unit.usecase';
import { UpdateUnitUseCase } from './useCases/update-unit.usecase';
import { DeleteUnitUseCase } from './useCases/delete-unit.usecase';
import { FindAllUnitsUseCase } from './useCases/find-all-units.usecase';
import { FindByIdUnitUseCase } from './useCases/find-by-id-unit.usecase';

@Module({
    controllers: [UnitsController],
    providers: [
        CreateUnitUseCase,
        UpdateUnitUseCase,
        DeleteUnitUseCase,
        FindAllUnitsUseCase,
        FindByIdUnitUseCase,
        { provide: 'UnitRepository', useClass: PrismaUnitsRepository },
    ],
    imports: [PrismaModule, AuthModule],
})
export class UnitsModule { }
