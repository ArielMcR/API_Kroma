import { Inject, Injectable } from '@nestjs/common';
import type { ObservationRepository } from '../domain/observation.repository';

@Injectable()
export class FindByClientObservationUseCase {
  constructor(
    @Inject('ObservationRepository')
    private readonly observationRepository: ObservationRepository,
  ) {}

  async execute(clientId: number) {
    return this.observationRepository.getObservationsByClientId(clientId);
  }
}
