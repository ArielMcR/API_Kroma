// client.repository.ts
import { Client } from './client.entity';

// Tipos de domínio - vivem na camada de domínio
export type CreateClientData = {
  name: string;
  lastName?: string | null;
  cellPhone: string;
  userId?: number | null;
};

export type UpdateClientData = Partial<CreateClientData>;

export interface ClientRepository {
  createClient(data: CreateClientData): Promise<any>;
  updateClient(data: UpdateClientData, id: number): Promise<any>;
  deleteClient(id: number): Promise<void>;
  getClientById(id: number): Promise<Client | null>;
  getAllClients(): Promise<Client[]>;
  /**
   * Busca por nome aproximado, usado pelo assistente (Sprint 3): o usuario fala
   * "agenda o Joao" e nao o id. Retorna null em vez de lancar — quem chama
   * transforma a ausencia em resposta em linguagem natural.
   */
  findByName(name: string): Promise<Client | null>;
}
