import { Inject, Injectable } from "@nestjs/common";
import type { ServicesRepository } from "../domain/services.repository";

@Injectable()
export class FindAllServicesUseCase {
    constructor(
        @Inject('ServiceRepository')
        private readonly serviceRepository: ServicesRepository
    ) { }
    async execute(companyId: number, unitId: number) {
        try {
            const services = await this.serviceRepository.getAllServices(companyId, unitId);
            return services;
        }
        catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }
}