import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ClientsModule } from '../clients/clients.module';
import { ServicesModule } from '../services/services.module';
import { ReportsModule } from '../reports/reports.module';

import { AssistantController } from './presentation/controller/assistant.controller';
import { ProcessCommandUseCase } from './useCases/process-command.usecase';
import { FindHistoryUseCase } from './useCases/find-history.usecase';
import { PrismaAssistantRepository } from './infra/prisma-assistant';
import { GeminiClient } from './infra/gemini.client';

/**
 * O assistente nao reimplementa nenhuma regra: ele importa os modulos de
 * negocio e chama os mesmos use cases das Sprints 1 e 2. E assim que a RN18
 * (validacoes respeitadas mesmo via LLM) sai de graca.
 */
@Module({
  controllers: [AssistantController],
  providers: [
    GeminiClient,
    ProcessCommandUseCase,
    FindHistoryUseCase,
    { provide: 'AssistantRepository', useClass: PrismaAssistantRepository },
  ],
  imports: [
    PrismaModule,
    AuthModule,
    AppointmentsModule,
    ClientsModule,
    ServicesModule,
    ReportsModule,
  ],
})
export class AssistantModule {}
