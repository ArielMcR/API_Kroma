import type {
  ClientRepository,
  CreateClientData,
} from './../domain/client.repository';
import { normalizarTelefone } from '../domain/normalizar-telefone';

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  async execute(data: CreateClientData) {
    const cellPhone = normalizarTelefone(data.cellPhone);
    if (!cellPhone) {
      throw new HttpException(
        'O celular do cliente é obrigatório.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.clientRepository.createClient({
      ...data,
      cellPhone,
    });
    if (!result) {
      throw new HttpException('Error creating client', 500);
    }
    return result;
  }
}
