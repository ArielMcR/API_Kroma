import { Inject, Injectable } from "@nestjs/common";
import type { CompanyRepository } from "../domain/company.repository";

@Injectable()
export class FindAllCompaniesUseCase {
    constructor(
        @Inject("CompanyRepository")
        private readonly companyRepository: CompanyRepository
    ) { }

    async execute() {
        return this.companyRepository.getAllCompanies();
    }
}
