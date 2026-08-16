import { Inject, Injectable } from '@nestjs/common';
import type {
  ObservationRepository,
  UpdateObservationData,
} from '../domain/observation.repository';

@Injectable()
export class UpdateObservationUseCase {
  constructor(
    @Inject('ObservationRepository')
    private readonly observationRepository: ObservationRepository,
  ) {}

  async execute(id: number, data: UpdateObservationData) {
    return this.observationRepository.updateObservation(id, data);
  }
}
