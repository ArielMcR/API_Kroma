import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';
import { Observation } from '../domain/observation.entity';
import {
  CreateObservationData,
  ObservationRepository,
  UpdateObservationData,
} from '../domain/observation.repository';

@Injectable()
export class PrismaObservationsRepository implements ObservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createObservation(data: CreateObservationData): Promise<Observation> {
    try {
      const { clientId, content, type } = data;
      return (await this.prisma.observation.create({
        data: { clientId, content, type },
      })) as Observation;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateObservation(
    id: number,
    data: UpdateObservationData,
  ): Promise<Observation> {
    try {
      const { content, type } = data;
      return (await this.prisma.observation.update({
        where: { id },
        data: { content, type },
      })) as Observation;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteObservation(id: number): Promise<void> {
    try {
      await this.prisma.observation.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getObservationById(id: number): Promise<Observation | null> {
    return this.prisma.observation.findFirst({
      where: { id, deletedAt: null },
    }) as Promise<Observation | null>;
  }

  async getObservationsByClientId(clientId: number): Promise<Observation[]> {
    return this.prisma.observation.findMany({
      where: { clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Observation[]>;
  }
}
