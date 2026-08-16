import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';
import { ServiceData } from '../domain/data/service.data';
import { UpdateServiceData } from '../domain/data/update-service.data';
import { ServicesRepository } from '../domain/services.repository';

const SELECT = {
  id: true,
  name: true,
  price: true,
  durationMinutes: true,
};

@Injectable()
export class PrismaServiceRepository implements ServicesRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async createService(data: ServiceData): Promise<any> {
    try {
      // Projecao explicita das colunas que existem em `Service`. O
      // InjectUserBodyInterceptor injeta `userId` em todo body autenticado e a
      // tabela nao tem essa coluna — repassar o body inteiro derruba o create
      // com PrismaClientValidationError ("Unknown argument `userId`").
      const { name, price, durationMinutes } = data;
      return await this.prismaService.service.create({
        data: { name, price, durationMinutes },
        select: SELECT,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async updateService(id: number, data: UpdateServiceData): Promise<any> {
    try {
      // Mesma projecao do create; `undefined` o Prisma simplesmente ignora,
      // entao o PATCH parcial continua parcial.
      const { name, price, durationMinutes } = data;
      return await this.prismaService.service.update({
        where: { id },
        data: { name, price, durationMinutes },
        select: SELECT,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async deleteService(id: number): Promise<void> {
    try {
      await this.prismaService.service.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
  async getServiceById(id: number): Promise<any | null> {
    return this.prismaService.service.findFirst({
      where: { id, deletedAt: null },
    });
  }
  async getAllServices(): Promise<any[]> {
    return await this.prismaService.service.findMany({
      where: { deletedAt: null },
    });
  }
  async findByName(name: string): Promise<any | null> {
    const termo = name.trim();
    if (!termo) return null;
    return this.prismaService.service.findFirst({
      where: { deletedAt: null, name: { contains: termo } },
      orderBy: { id: 'asc' },
    });
  }
}
