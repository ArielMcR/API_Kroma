import { Inject, Injectable } from '@nestjs/common';
import type { AssistantRepository } from '../domain/assistant.repository';

const LIMITE_PADRAO = 30;
const LIMITE_MAXIMO = 100;

@Injectable()
export class FindHistoryUseCase {
  constructor(
    @Inject('AssistantRepository')
    private readonly assistantRepository: AssistantRepository,
  ) {}

  async execute(userId: number, limit?: number) {
    const teto = Math.min(limit ?? LIMITE_PADRAO, LIMITE_MAXIMO);
    return this.assistantRepository.findHistoryByUser(userId, teto);
  }
}
