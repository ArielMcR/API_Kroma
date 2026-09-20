import { Injectable, Inject } from '@nestjs/common';
import type {
  ClientRepository,
  UpdateClientData,
} from '../domain/client.repository';
import { normalizarTelefone } from '../domain/normalizar-telefone';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  execute(data: UpdateClientData, id: number) {
    const payload = { ...data };
    if (payload.cellPhone !== undefined) {
      payload.cellPhone = normalizarTelefone(payload.cellPhone);
    }
    return this.clientRepository.updateClient(payload, id);
  }
}
