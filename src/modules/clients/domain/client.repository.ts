// client.repository.ts
import { Client } from "./client.entity";

// Tipos de domínio - vivem na camada de domínio
export type CreateClientData = {
    name: string;
    lastName?: string | null;
    cellPhone: string;
    companyId?: number | null;
    unitId?: number | null;
}

export type UpdateClientData = Partial<CreateClientData>;

export interface ClientRepository {
    createClient(data: CreateClientData): Promise<any>;
    updateClient(data: UpdateClientData, id: number): Promise<any>;
    deleteClient(id: number): Promise<void>;
    getClientById(id: number): Promise<Client | null>;
    getAllClients(user): Promise<Client[]>;
}