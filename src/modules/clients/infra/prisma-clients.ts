import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Client } from '../domain/client.entity';
import { ClientRepository, CreateClientData, UpdateClientData } from '../domain/client.repository';
import { HttpException, Injectable } from "@nestjs/common";
import { UserAuthDto } from 'src/modules/auth/presentation/dto/user-auth.dto';

@Injectable()
export class PrismaClientsRepository implements ClientRepository {
    constructor(private readonly prisma: PrismaService) { }
    async createClient(data: CreateClientData): Promise<any> {
        return await this.prisma.client.create({ data });
    }
    async updateClient(data: UpdateClientData, id: number): Promise<any> {
        return await this.prisma.client.update({
            where: { id },
            data,
        });
    }
    async deleteClient(id: number): Promise<void> {
        return await this.prisma.client.delete({ where: { id } }).then(() => { });
    }
    async getClientById(id: number): Promise<Client | null> {
        const result = await this.prisma.client.findUnique({ where: { id } });
        if (result) return result;
        throw new HttpException('Client not found', 404);
    }
    async getAllClients(user: UserAuthDto): Promise<Client[]> {
        return await this.prisma.client.findMany({
            where: {
                companyId: user.companyId,
                unitId: user.unitId
            }
        });
    }
}