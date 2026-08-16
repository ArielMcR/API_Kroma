import { Inject, Injectable } from '@nestjs/common';
import type { SettingsRepository } from '../domain/settings.repository';

@Injectable()
export class FindSettingsUseCase {
  constructor(
    @Inject('SettingsRepository')
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute() {
    return this.settingsRepository.getSettings();
  }
}
