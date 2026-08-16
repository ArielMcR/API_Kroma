import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateObservationData,
  ObservationRepository,
} from '../domain/observation.repository';

@Injectable()
export class CreateObservationUseCase {
  constructor(
    @Inject('ObservationRepository')
    private readonly observationRepository: ObservationRepository,
  ) {}

  async execute(data: CreateObservationData) {
    return this.observationRepository.createObservation(data);
  }
}
