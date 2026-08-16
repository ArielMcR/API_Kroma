import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Client } from '../../domain/client.entity';
import { CreateClientDTO } from '../dto/create-client.dto';
import { UpdateClientDTO } from '../dto/update-client.dto';
import { UpdateClientUseCase } from '../../useCases/update-client.usecase';
import { DeleteClientUseCase } from '../../useCases/delete-client.usecase';
import { FindAllClientsUseCase } from '../../useCases/find-all-clients.usecase';
import { CreateClientUseCase } from '../../useCases/create-client.usecase';
import { FindUniqueClientUseCase } from '../../useCases/find-unique-client.usecase';
import { CurrentUser } from 'src/modules/auth/presentation/decorators/current-user.decorator';
import type { UserAuthDto } from 'src/modules/auth/presentation/dto/user-auth.dto';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly create: CreateClientUseCase,
    private readonly update: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
    private readonly getById: FindUniqueClientUseCase,
    private readonly getAll: FindAllClientsUseCase,
  ) {}

  @Get()
  async getAll_(): Promise<Client[]> {
    return await this.getAll.execute();
  }

  @Post()
  @Roles('SUPERVISOR') // -> apenas usuarios com esse papel ou superior podem acessar essa rota
  @UseGuards(RolesGuard)
  async create_(@Body() data: CreateClientDTO): Promise<Client> {
    const response = await this.create.execute(data);
    if (!response) {
      throw new HttpException('Error creating client', 500);
    }
    return {
      ...response,
      statusCode: 201,
      success: true,
    };
  }

  @Patch(':id')
  @Roles('SUPERVISOR') // -> apenas usuarios com esse papel ou superior podem acessar essa rota
  @UseGuards(RolesGuard)
  async update_(
    @Body() data: UpdateClientDTO,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.update.execute(data, +id);
  }

  @Delete(':id')
  @Roles('SUPERVISOR') // -> apenas usuarios com esse papel ou superior podem acessar essa rota
  @UseGuards(RolesGuard)
  async delete_(@Param('id') id: string): Promise<void> {
    return await this.deleteClient.execute(+id);
  }

  @Get(':id')
  async getById_(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Client | null> {
    return await this.getById.execute(id);
  }
}
