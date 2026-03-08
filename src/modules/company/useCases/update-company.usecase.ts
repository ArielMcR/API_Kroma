import { Inject, Injectable } from "@nestjs/common";
import type { CompanyRepository, UpdateCompanyData } from "../domain/company.repository";

@Injectable()
export class UpdateCompanyUseCase {
    constructor(
        @Inject("CompanyRepository")
        private readonly companyRepository: CompanyRepository
    ) { }

    async execute(id: number, data: UpdateCompanyData) {
        return this.companyRepository.updateCompany(id, data);
    }
}
