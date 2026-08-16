import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateObservationDto } from '../dto/create-observation.dto';
import { UpdateObservationDto } from '../dto/update-observation.dto';
import { CreateObservationUseCase } from '../../useCases/create-observation.usecase';
import { UpdateObservationUseCase } from '../../useCases/update-observation.usecase';
import { DeleteObservationUseCase } from '../../useCases/delete-observation.usecase';
import { FindByClientObservationUseCase } from '../../useCases/find-by-client-observation.usecase';

@Controller('observations')
export class ObservationsController {
  constructor(
    private readonly create: CreateObservationUseCase,
    private readonly update: UpdateObservationUseCase,
    private readonly deleteObservation: DeleteObservationUseCase,
    private readonly findByClient: FindByClientObservationUseCase,
  ) {}

  @Post()
  async create_(@Body() data: CreateObservationDto) {
    return this.create.execute(data);
  }

  @Get('client/:clientId')
  async findByClient_(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.findByClient.execute(clientId);
  }

  @Patch(':id')
  async update_(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateObservationDto,
  ) {
    return this.update.execute(id, data);
  }

  @Delete(':id')
  async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteObservation.execute(id);
  }
}
