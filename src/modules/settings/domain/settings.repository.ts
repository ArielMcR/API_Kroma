import { Settings } from './settings.entity';

export type UpdateSettingsData = Partial<{
  tradeName: string;
  legalName: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
}>;

export interface SettingsRepository {
  getSettings(): Promise<Settings | null>;
  updateSettings(data: UpdateSettingsData): Promise<Settings>;
}
