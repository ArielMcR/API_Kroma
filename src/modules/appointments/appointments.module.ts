import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsController } from './presentation/controller/appointments.controller';
import { PrismaAppointmentsRepository } from './infra/prisma-appointments';
import { CreateAppointmentUseCase } from './useCases/create-appointment.usecase';
import { UpdateAppointmentUseCase } from './useCases/update-appointment.usecase';
import { DeleteAppointmentUseCase } from './useCases/delete-appointment.usecase';
import { FindAllAppointmentsUseCase } from './useCases/find-all-appointments.usecase';
import { FindByIdAppointmentUseCase } from './useCases/find-by-id-appointment.usecase';

@Module({
    controllers: [AppointmentsController],
    providers: [
        CreateAppointmentUseCase,
        UpdateAppointmentUseCase,
        DeleteAppointmentUseCase,
        FindAllAppointmentsUseCase,
        FindByIdAppointmentUseCase,
        { provide: 'AppointmentRepository', useClass: PrismaAppointmentsRepository },
    ],
    imports: [PrismaModule, AuthModule],
})
export class AppointmentsModule { }
