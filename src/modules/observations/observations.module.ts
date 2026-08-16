import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ObservationsController } from './presentation/controller/observations.controller';
import { PrismaObservationsRepository } from './infra/prisma-observations';
import { CreateObservationUseCase } from './useCases/create-observation.usecase';
import { UpdateObservationUseCase } from './useCases/update-observation.usecase';
import { DeleteObservationUseCase } from './useCases/delete-observation.usecase';
import { FindByClientObservationUseCase } from './useCases/find-by-client-observation.usecase';

@Module({
  controllers: [ObservationsController],
  providers: [
    CreateObservationUseCase,
    UpdateObservationUseCase,
    DeleteObservationUseCase,
    FindByClientObservationUseCase,
    {
      provide: 'ObservationRepository',
      useClass: PrismaObservationsRepository,
    },
  ],
  imports: [PrismaModule, AuthModule],
})
export class ObservationsModule {}
