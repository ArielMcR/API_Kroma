import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Client } from '../domain/client.entity';
import {
  ClientRepository,
  CreateClientData,
  UpdateClientData,
} from '../domain/client.repository';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';

@Injectable()
export class PrismaClientsRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createClient(data: CreateClientData): Promise<any> {
    try {
      const { name, lastName, cellPhone } = data;
      return await this.prisma.client.create({
        data: { name, lastName, cellPhone },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async updateClient(data: UpdateClientData, id: number): Promise<any> {
    try {
      const projectedData: UpdateClientData = {};
      if (data.name !== undefined) projectedData.name = data.name;
      if (data.lastName !== undefined) projectedData.lastName = data.lastName;
      if (data.cellPhone !== undefined)
        projectedData.cellPhone = data.cellPhone;
      return await this.prisma.client.update({
        where: { id },
        data: projectedData,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async deleteClient(id: number): Promise<void> {
    try {
      await this.prisma.client.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async getClientById(id: number): Promise<Client | null> {
    const result = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
    });
    if (result) return result;
    throw new HttpException('Client not found', HttpStatus.NOT_FOUND);
  }
  async getAllClients(): Promise<Client[]> {
    return await this.prisma.client.findMany({
      where: { deletedAt: null },
    });
  }

  async findByName(name: string): Promise<Client | null> {
    const termo = name.trim();
    if (!termo) return null;

    // O collation padrao do MySQL ja e case-insensitive, por isso `contains`
    // basta. Tenta primeiro o nome completo ("Joao Silva" -> name + lastName)
    // e so depois o primeiro nome isolado, senao "Joao" casaria com o primeiro
    // Joao qualquer mesmo quando o usuario deu o sobrenome.
    const [primeiro, ...resto] = termo.split(/\s+/);
    const sobrenome = resto.join(' ');

    if (sobrenome) {
      const exato = await this.prisma.client.findFirst({
        where: {
          deletedAt: null,
          name: { contains: primeiro },
          lastName: { contains: sobrenome },
        },
      });
      if (exato) return exato;
    }

    return this.prisma.client.findFirst({
      where: { deletedAt: null, name: { contains: primeiro } },
      orderBy: { id: 'asc' },
    });
  }
}
