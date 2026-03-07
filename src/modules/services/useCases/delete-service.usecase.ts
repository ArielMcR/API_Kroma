import { Inject, Injectable } from "@nestjs/common";
import type { ServicesRepository } from "../domain/services.repository";

@Injectable()
export class DeleteServiceUseCase {
    constructor(@Inject('ServiceRepository') private readonly serviceRepository: ServicesRepository) { }
    async execute(id: number) {
        try {
            const result = await this.serviceRepository.deleteService(id);
            return result;
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }
}