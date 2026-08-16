import { Module } from '@nestjs/common';
import { ClientsController } from './presentation/controller/clients.controller';
import { PrismaClientsRepository } from './infra/prisma-clients';
import { CreateClientUseCase } from './useCases/create-client.usecase';
import { UpdateClientUseCase } from './useCases/update-client.usecase';
import { DeleteClientUseCase } from './useCases/delete-client.usecase';
import { FindAllClientsUseCase } from './useCases/find-all-clients.usecase';
import { PrismaModule } from '../prisma/prisma.module';
import { FindUniqueClientUseCase } from './useCases/find-unique-client.usecase';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ClientsController],
  providers: [
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    FindAllClientsUseCase,
    FindUniqueClientUseCase,
    { provide: 'ClientRepository', useClass: PrismaClientsRepository },
  ],
  imports: [PrismaModule, AuthModule],
  // Consumidos pelo AssistantModule (Sprint 3): o use case para criar e o
  // repositorio para o findByName da busca por nome falado.
  exports: [
    CreateClientUseCase,
    { provide: 'ClientRepository', useClass: PrismaClientsRepository },
  ],
})
export class ClientsModule {}
