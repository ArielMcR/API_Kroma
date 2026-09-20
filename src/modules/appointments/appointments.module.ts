import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsController } from './presentation/controller/appointments.controller';
import { PrismaAppointmentsRepository } from './infra/prisma-appointments';
import { CreateAppointmentUseCase } from './useCases/create-appointment.usecase';
import { UpdateAppointmentUseCase } from './useCases/update-appointment.usecase';
import { DeleteAppointmentUseCase } from './useCases/delete-appointment.usecase';
import { FindAllAppointmentsUseCase } from './useCases/find-all-appointments.usecase';
import { FindByIdAppointmentUseCase } from './useCases/find-by-id-appointment.usecase';
import { CancelAppointmentUseCase } from './useCases/cancel-appointment.usecase';
import { CompleteAppointmentUseCase } from './useCases/complete-appointment.usecase';
import { FindAppointmentsByDateUseCase } from './useCases/find-appointments-by-date.usecase';

@Module({
  controllers: [AppointmentsController],
  providers: [
    CreateAppointmentUseCase,
    UpdateAppointmentUseCase,
    DeleteAppointmentUseCase,
    FindAllAppointmentsUseCase,
    FindAppointmentsByDateUseCase,
    FindByIdAppointmentUseCase,
    CancelAppointmentUseCase,
    CompleteAppointmentUseCase,
    {
      provide: 'AppointmentRepository',
      useClass: PrismaAppointmentsRepository,
    },
  ],
  imports: [PrismaModule, AuthModule, ServicesModule, UsersModule],
  // Consumidos pelo AssistantModule (Sprint 3).
  exports: [CreateAppointmentUseCase, FindAppointmentsByDateUseCase],
})
export class AppointmentsModule {}
