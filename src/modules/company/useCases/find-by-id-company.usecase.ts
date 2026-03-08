import { Inject, Injectable } from "@nestjs/common";
import type { CompanyRepository } from "../domain/company.repository";

@Injectable()
export class FindByIdCompanyUseCase {
    constructor(
        @Inject("CompanyRepository")
        private readonly companyRepository: CompanyRepository
    ) { }

    async execute(id: number) {
        return this.companyRepository.getCompanyById(id);
    }
}
