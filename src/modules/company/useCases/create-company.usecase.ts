import { Inject, Injectable } from "@nestjs/common";
import type { CompanyRepository, CreateCompanyData } from "../domain/company.repository";

@Injectable()
export class CreateCompanyUseCase {
    constructor(
        @Inject("CompanyRepository")
        private readonly companyRepository: CompanyRepository
    ) { }

    async execute(data: CreateCompanyData) {
        return this.companyRepository.createCompany(data);
    }
}
