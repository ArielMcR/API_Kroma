import type { CommandStatus, CommandTool } from '@prisma/client';

export type SaveCommandData = {
  userId: number;
  rawText: string;
  interpretedIntent?: string | null;
  toolExecuted?: CommandTool | null;
  parameters?: Record<string, unknown> | null;
  result?: string | null;
  status: CommandStatus;
  errorMessage?: string | null;
  durationMs: number;
};

export type AssistantCommandRecord = {
  id: number;
  rawText: string;
  interpretedIntent: string | null;
  toolExecuted: CommandTool | null;
  result: string | null;
  status: CommandStatus;
  errorMessage: string | null;
  durationMs: number;
  createdAt: Date;
};

export interface AssistantRepository {
  saveCommand(data: SaveCommandData): Promise<{ id: number }>;
  findHistoryByUser(
    userId: number,
    limit: number,
  ): Promise<AssistantCommandRecord[]>;
}
