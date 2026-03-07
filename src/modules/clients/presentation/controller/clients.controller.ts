import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';

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
    ) { }

    @Get()
    async getAll_(@CurrentUser() user: UserAuthDto): Promise<Client[]> {
        return await this.getAll.execute(user);
    }

    @Post()
    @Roles('SUPER_ADMIN', 'ADMIN') // -> apenas usuarios com esses papeis podem acessar essa rota
    @UseGuards(RolesGuard)
    async create_(@Body() data: CreateClientDTO): Promise<Client> {
        console.log(data);
        return await this.create.execute(data);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'ADMIN') // -> apenas usuarios com esses papeis podem acessar essa rota
    @UseGuards(RolesGuard)
    async update_(@Body() data: UpdateClientDTO, @Param('id') id: string): Promise<any> {
        return await this.update.execute(data, +id);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN', 'ADMIN') // -> apenas usuarios com esses papeis podem acessar essa rota
    @UseGuards(RolesGuard)
    async delete_(@Param('id') id: string): Promise<void> {
        return await this.deleteClient.execute(+id);
    }

    @Get(':id')
    async getById_(@Param('id', ParseIntPipe) id: number): Promise<Client | null> {
        return await this.getById.execute(id);
    }
}
