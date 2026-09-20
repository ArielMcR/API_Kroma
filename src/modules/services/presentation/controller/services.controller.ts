import { CreateServiceUseCase } from './../../useCases/create-service.usecase';
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
import { DeleteServiceUseCase } from '../../useCases/delete-service.usecase';
import { UpdateServiceUseCase } from '../../useCases/update-service.usecase';
import { FindByIdServiceUseCase } from '../../useCases/find-by-id-service.usecase';
import { FindAllServicesUseCase } from '../../useCases/find-all-services.usecase';
import { CreateServiceDTO } from '../dto/create-services.dto';
import { ServiceData } from '../../domain/data/service.data';
import { UpdateServiceDTO } from '../dto/update-services.dto';
import { UpdateServiceData } from '../../domain/data/update-service.data';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly deleteServiceUseCase: DeleteServiceUseCase,
    private readonly getServiceUseCase: FindByIdServiceUseCase,
    private readonly getAllServiceUseCase: FindAllServicesUseCase,
  ) {}

  @Get()
  async findAll() {
    try {
      return await this.getAllServiceUseCase.execute();
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async findById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.getServiceUseCase.execute(id);
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async create(@Body() data: CreateServiceDTO) {
    try {
      const data_: ServiceData = data;
      return await this.createServiceUseCase.execute(data_);
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @Roles('SUPERVISOR')
  @UseGuards(RolesGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateServiceDTO,
  ) {
    try {
      const data_: UpdateServiceData = data;
      return await this.updateServiceUseCase.execute(id, data_);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @Roles('SUPERVISOR')
  @UseGuards(RolesGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.deleteServiceUseCase.execute(id);
    } catch (error) {
      throw error;
    }
  }
}
