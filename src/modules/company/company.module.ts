import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CompanyController } from './presentation/controller/company.controller';
import { PrismaCompanyRepository } from './infra/prisma-company';
import { CreateCompanyUseCase } from './useCases/create-company.usecase';
import { UpdateCompanyUseCase } from './useCases/update-company.usecase';
import { DeleteCompanyUseCase } from './useCases/delete-company.usecase';
import { FindAllCompaniesUseCase } from './useCases/find-all-companies.usecase';
import { FindByIdCompanyUseCase } from './useCases/find-by-id-company.usecase';

@Module({
    controllers: [CompanyController],
    providers: [
        CreateCompanyUseCase,
        UpdateCompanyUseCase,
        DeleteCompanyUseCase,
        FindAllCompaniesUseCase,
        FindByIdCompanyUseCase,
        { provide: 'CompanyRepository', useClass: PrismaCompanyRepository },
    ],
    imports: [PrismaModule, AuthModule],
})
export class CompanyModule { }
