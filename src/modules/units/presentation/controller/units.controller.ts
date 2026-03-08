import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { CreateUnitUseCase } from '../../useCases/create-unit.usecase';
import { UpdateUnitUseCase } from '../../useCases/update-unit.usecase';
import { DeleteUnitUseCase } from '../../useCases/delete-unit.usecase';
import { FindAllUnitsUseCase } from '../../useCases/find-all-units.usecase';
import { FindByIdUnitUseCase } from '../../useCases/find-by-id-unit.usecase';

@Controller('units')
@Roles('SUPER_ADMIN')
@UseGuards(RolesGuard)
export class UnitsController {
    constructor(
        private readonly create: CreateUnitUseCase,
        private readonly update: UpdateUnitUseCase,
        private readonly deleteUnit: DeleteUnitUseCase,
        private readonly getAll: FindAllUnitsUseCase,
        private readonly getById: FindByIdUnitUseCase,
    ) { }

    @Get()
    async getAll_(@Query('companyId') companyId?: string) {
        return this.getAll.execute(companyId ? +companyId : undefined);
    }

    @Get(':id')
    async getById_(@Param('id', ParseIntPipe) id: number) {
        return this.getById.execute(id);
    }

    @Post()
    async create_(@Body() data: CreateUnitDto) {
        return this.create.execute(data);
    }

    @Patch(':id')
    async update_(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUnitDto) {
        return this.update.execute(id, data);
    }

    @Delete(':id')
    async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.deleteUnit.execute(id);
    }
}
