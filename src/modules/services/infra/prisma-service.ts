import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { ServiceData } from "../domain/data/service.data";
import { ServicesRepository } from "../domain/services.repository";

@Injectable()
export class PrismaServiceRepository implements ServicesRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async createService(data: ServiceData): Promise<any> {
        try {
            const result = await this.prismaService.service.create({
                data, select: {
                    id: true,
                    companyId: true,
                    unitId: true,
                    name: true,
                    price: true,
                    durationMinutes: true,
                }
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
    async updateService(id: number, data: ServiceData): Promise<any> {
        try {
            const result = await this.prismaService.service.update({
                where: { id },
                data, select: {
                    id: true,
                    companyId: true,
                    unitId: true,
                    name: true,
                    price: true,
                    durationMinutes: true,
                }
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
    async deleteService(id: number): Promise<void> {
        try {
            return await this.prismaService.service.delete({ where: { id } }).then(() => { });
        } catch (error) {
            throw error;
        }
    }
    async getServiceById(id: number): Promise<any | null> {
        try {
            const result = await this.prismaService.service.findUnique({ where: { id } });
            if (result) return result;
            return null;
        } catch (error) {
            throw error;
        }
    }
    async getAllServices(companyId: number, unitId: number): Promise<any[]> {
        try {
            return await this.prismaService.service.findMany({
                where: { companyId, unitId, deletedAt: null }
            });
        } catch (error) {
            throw error;
        }
    }

}