import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CreateCompanyUseCase } from '../../useCases/create-company.usecase';
import { UpdateCompanyUseCase } from '../../useCases/update-company.usecase';
import { DeleteCompanyUseCase } from '../../useCases/delete-company.usecase';
import { FindAllCompaniesUseCase } from '../../useCases/find-all-companies.usecase';
import { FindByIdCompanyUseCase } from '../../useCases/find-by-id-company.usecase';

@Controller('companies')
@Roles('SUPER_ADMIN')
@UseGuards(RolesGuard)
export class CompanyController {
    constructor(
        private readonly create: CreateCompanyUseCase,
        private readonly update: UpdateCompanyUseCase,
        private readonly deleteCompany: DeleteCompanyUseCase,
        private readonly getAll: FindAllCompaniesUseCase,
        private readonly getById: FindByIdCompanyUseCase,
    ) { }

    @Get()
    async getAll_() {
        return this.getAll.execute();
    }

    @Get(':id')
    async getById_(@Param('id', ParseIntPipe) id: number) {
        return this.getById.execute(id);
    }

    @Post()
    async create_(@Body() data: CreateCompanyDto) {
        return this.create.execute(data);
    }

    @Patch(':id')
    async update_(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateCompanyDto) {
        return this.update.execute(id, data);
    }

    @Delete(':id')
    async delete_(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.deleteCompany.execute(id);
    }
}
