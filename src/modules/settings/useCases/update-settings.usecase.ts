import { Inject, Injectable } from '@nestjs/common';
import type {
  SettingsRepository,
  UpdateSettingsData,
} from '../domain/settings.repository';

@Injectable()
export class UpdateSettingsUseCase {
  constructor(
    @Inject('SettingsRepository')
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(data: UpdateSettingsData) {
    return this.settingsRepository.updateSettings(data);
  }
}
