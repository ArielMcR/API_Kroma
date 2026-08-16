import { Inject, Injectable } from '@nestjs/common';
import type { ClientRepository } from '../domain/client.repository';

@Injectable()
export class FindUniqueClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  async execute(id: number) {
    return this.clientRepository.getClientById(id);
  }
}
