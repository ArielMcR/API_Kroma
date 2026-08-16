import { Default } from 'src/modules/common/domain/default/default.domain';

export type TipoObservacao = 'CANCELAMENTO' | 'PREFERENCIA' | 'OUTRO';

export class Observation extends Default {
  id!: number;
  clientId!: number;
  content!: string;
  type!: TipoObservacao;
}
