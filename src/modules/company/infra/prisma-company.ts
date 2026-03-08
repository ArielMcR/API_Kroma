import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { Company } from "../domain/company.entity";
import { CompanyRepository, CreateCompanyData, UpdateCompanyData } from "../domain/company.repository";

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createCompany(data: CreateCompanyData): Promise<Company> {
        return this.prisma.company.create({ data }) as Promise<Company>;
    }

    async updateCompany(id: number, data: UpdateCompanyData): Promise<Company> {
        return this.prisma.company.update({ where: { id }, data }) as Promise<Company>;
    }

    async deactivateCompany(id: number): Promise<void> {
        await this.prisma.company.update({ where: { id }, data: { active: false } });
    }

    async getCompanyById(id: number): Promise<Company | null> {
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company) throw new HttpException('Company not found', 404);
        return company as Company;
    }

    async getAllCompanies(): Promise<Company[]> {
        return this.prisma.company.findMany({ where: { active: true } }) as Promise<Company[]>;
    }
}
