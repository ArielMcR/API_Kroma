import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsController } from './presentation/controller/settings.controller';
import { PrismaSettingsRepository } from './infra/prisma-settings';
import { FindSettingsUseCase } from './useCases/find-settings.usecase';
import { UpdateSettingsUseCase } from './useCases/update-settings.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [
    FindSettingsUseCase,
    UpdateSettingsUseCase,
    { provide: 'SettingsRepository', useClass: PrismaSettingsRepository },
  ],
})
export class SettingsModule {}
