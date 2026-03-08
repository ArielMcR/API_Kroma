import { Company } from "./company.entity";

export type CreateCompanyData = {
    tradeName: string;
    legalName: string;
    cnpj: string;
    plan?: string | null;
    active?: boolean;
}

export type UpdateCompanyData = Partial<CreateCompanyData>;

export interface CompanyRepository {
    createCompany(data: CreateCompanyData): Promise<Company>;
    updateCompany(id: number, data: UpdateCompanyData): Promise<Company>;
    deactivateCompany(id: number): Promise<void>;
    getCompanyById(id: number): Promise<Company | null>;
    getAllCompanies(): Promise<Company[]>;
}
