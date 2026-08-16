export class Settings {
  id!: number;
  tradeName!: string;
  legalName!: string;
  cnpj?: string | null;
  address?: string | null;
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
