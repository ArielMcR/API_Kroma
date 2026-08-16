import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';
import { Settings } from '../domain/settings.entity';
import {
  SettingsRepository,
  UpdateSettingsData,
} from '../domain/settings.repository';

@Injectable()
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<Settings | null> {
    return (await this.prisma.settings.findFirst()) as Settings | null;
  }

  async updateSettings(data: UpdateSettingsData): Promise<Settings> {
    try {
      const current = await this.prisma.settings.findFirst();
      if (!current) {
        throw new HttpException(
          'Dados da barbearia nao encontrados. Rode o seed.',
          HttpStatus.NOT_FOUND,
        );
      }
      // Projecao explicita: o InjectUserBodyInterceptor injeta userId no body.
      const { tradeName, legalName, cnpj, address, phone } = data;
      return (await this.prisma.settings.update({
        where: { id: current.id },
        data: { tradeName, legalName, cnpj, address, phone },
      })) as Settings;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      handlePrismaError(error);
    }
  }
}
