import { Inject, Injectable } from "@nestjs/common";
import type { CompanyRepository } from "../domain/company.repository";

@Injectable()
export class DeleteCompanyUseCase {
    constructor(
        @Inject("CompanyRepository")
        private readonly companyRepository: CompanyRepository
    ) { }

    async execute(id: number): Promise<void> {
        return this.companyRepository.deactivateCompany(id);
    }
}
