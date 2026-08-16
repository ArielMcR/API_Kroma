import type {
  ClientRepository,
  CreateClientData,
} from './../domain/client.repository';

import { HttpException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject('ClientRepository')
    private readonly clientRepository: ClientRepository,
  ) {}
  async execute(data: CreateClientData) {
    const result = await this.clientRepository.createClient(data);
    if (!result) {
      throw new HttpException('Error creating client', 500);
    }
    return result;
  }
}
