import { Inject, Injectable } from "@nestjs/common";
import type { ServicesRepository } from "../domain/services.repository";
import { ServiceData } from "../domain/data/service.data";


@Injectable()
export class CreateServiceUseCase {
    constructor(
        @Inject('ServiceRepository') private readonly serviceRepository: ServicesRepository,
    ) { }

    async execute(serviceData: ServiceData) {
        try {
            const createdService = await this.serviceRepository.createService(serviceData);
            return createdService;
        } catch (error) {
            console.error('Error creating service:', error);
            throw error;
        }
    }
}