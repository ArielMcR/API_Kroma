import { Inject, Injectable } from "@nestjs/common";
import type { ServicesRepository } from "../domain/services.repository";
import { ServiceData } from "../domain/data/service.data";
import { UpdateServiceData } from "../domain/data/update-service.data";

@Injectable()
export class UpdateServiceUseCase {
    constructor(@Inject('ServiceRepository') private readonly serviceRepository: ServicesRepository) { }
    async execute(id: number, data: UpdateServiceData) {
        try {
            const updatedService = await this.serviceRepository.updateService(id, data);
            return updatedService;
        } catch (error) {
            console.error('Error updating service:', error);
            throw error;
        }
    }
}