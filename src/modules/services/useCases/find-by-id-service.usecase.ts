import { Inject, Injectable } from '@nestjs/common';
import type { ServicesRepository } from '../domain/services.repository';

@Injectable()
export class FindByIdServiceUseCase {
  constructor(
    @Inject('ServiceRepository')
    private readonly serviceRepository: ServicesRepository,
  ) {}

  async execute(id: number) {
    try {
      return await this.serviceRepository.getServiceById(id);
    } catch (error) {
      console.error('Error finding service by id:', error);
      throw error;
    }
  }
}
