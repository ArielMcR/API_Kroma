export class Company {
    id!: number;
    tradeName!: string;
    legalName!: string;
    cnpj!: string;
    plan?: string | null;
    active!: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
