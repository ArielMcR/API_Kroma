import { Inject, Injectable } from '@nestjs/common';
import type { ObservationRepository } from '../domain/observation.repository';

@Injectable()
export class DeleteObservationUseCase {
  constructor(
    @Inject('ObservationRepository')
    private readonly observationRepository: ObservationRepository,
  ) {}

  async execute(id: number) {
    return this.observationRepository.deleteObservation(id);
  }
}
