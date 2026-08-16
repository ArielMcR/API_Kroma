import { Inject, Injectable } from '@nestjs/common';
import type { ClientRepository } from '../domain/client.repository';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  execute(clientId: number) {
    // Logic to delete a client
    return this.clientRepository.deleteClient(clientId);
  }
}
