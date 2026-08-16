import { Injectable, Inject } from '@nestjs/common';
import type {
  ClientRepository,
  UpdateClientData,
} from '../domain/client.repository';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  execute(data: UpdateClientData, id: number) {
    return this.clientRepository.updateClient(data, id);
  }
}
