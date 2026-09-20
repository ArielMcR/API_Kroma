import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/modules/auth/presentation/decorators/current-user.decorator';
import type { UserAuthDto } from 'src/modules/auth/presentation/dto/user-auth.dto';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { CreateAppointmentUseCase } from '../../useCases/create-appointment.usecase';
import { UpdateAppointmentUseCase } from '../../useCases/update-appointment.usecase';
import { DeleteAppointmentUseCase } from '../../useCases/delete-appointment.usecase';
import { FindAllAppointmentsUseCase } from '../../useCases/find-all-appointments.usecase';
import { FindByIdAppointmentUseCase } from '../../useCases/find-by-id-appointment.usecase';
import { CancelAppointmentUseCase } from '../../useCases/cancel-appointment.usecase';
import { CompleteAppointmentUseCase } from '../../useCases/complete-appointment.usecase';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly create: CreateAppointmentUseCase,
    private readonly update: UpdateAppointmentUseCase,
    private readonly deleteAppointment: DeleteAppointmentUseCase,
    private readonly getAll: FindAllAppointmentsUseCase,
    private readonly getById: FindByIdAppointmentUseCase,
    private readonly cancel: CancelAppointmentUseCase,
    private readonly complete: CompleteAppointmentUseCase,
  ) {}

  @Get()
  async getAll_(@CurrentUser() user: UserAuthDto) {
    return this.getAll.execute(user.id);
  }

  @Get(':id')
  async getById_(@Param('id', ParseIntPipe) id: number) {
    return this.getById.execute(id);
  }

  @Post()
  async create_(@Body() data: CreateAppointmentDto) {
    return this.create.execute(data as any);
  }

  @Patch(':id')
  @Roles('BARBER')
  @UseGuards(RolesGuard)
  async update_(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateAppointmentDto,
  ) {
    return this.update.execute(id, data as any);
  }

  @Post(':id/cancel')
  async cancel_(@Param('id', ParseIntPipe) id: number) {
    return this.cancel.execute(id);
  }

  @Post(':id/complete')
  async complete_(@Param('id', ParseIntPipe) id: number) {
    return this.complete.execute(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteAppointment.execute(id);
  }
}
