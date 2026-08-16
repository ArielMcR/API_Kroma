import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import type {
  AssistantCommandRecord,
  AssistantRepository,
  SaveCommandData,
} from '../domain/assistant.repository';

@Injectable()
export class PrismaAssistantRepository implements AssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveCommand(data: SaveCommandData): Promise<{ id: number }> {
    const registro = await this.prisma.assistantCommand.create({
      data: {
        userId: data.userId,
        rawText: data.rawText,
        interpretedIntent: data.interpretedIntent ?? null,
        toolExecuted: data.toolExecuted ?? null,
        parameters: (data.parameters ??
          Prisma.JsonNull) as Prisma.InputJsonValue,
        result: data.result ?? null,
        status: data.status,
        errorMessage: data.errorMessage ?? null,
        durationMs: data.durationMs,
      },
      select: { id: true },
    });

    return registro;
  }

  async findHistoryByUser(
    userId: number,
    limit: number,
  ): Promise<AssistantCommandRecord[]> {
    return this.prisma.assistantCommand.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        rawText: true,
        interpretedIntent: true,
        toolExecuted: true,
        result: true,
        status: true,
        errorMessage: true,
        durationMs: true,
        createdAt: true,
      },
    });
  }
}
