import { Default } from 'src/modules/common/domain/default/default.domain';

export class Service extends Default {
  id!: number;
  name!: string;
  price!: number;
  durationMinutes!: number;
}
