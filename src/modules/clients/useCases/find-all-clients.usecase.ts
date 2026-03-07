import type { ClientRepository } from './../domain/client.repository';
import { Injectable, Inject } from "@nestjs/common";
import { Client } from "../domain/client.entity";

@Injectable()
export class FindAllClientsUseCase {
    constructor(@Inject("ClientRepository") private readonly clientRepository: ClientRepository) { }
    execute(user): Promise<Client[]> {
        return this.clientRepository.getAllClients(user);
    }
}