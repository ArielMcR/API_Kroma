import { Default } from 'src/modules/common/domain/default/default.domain';

export class Client extends Default {
  id!: number;
  name!: string;
  lastName?: string | null;
  cellPhone!: string;
  email?: string;
}
