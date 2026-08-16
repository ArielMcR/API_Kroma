import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { TipoObservacao } from '../../domain/observation.entity';

const TIPOS_OBSERVACAO: TipoObservacao[] = [
  'CANCELAMENTO',
  'PREFERENCIA',
  'OUTRO',
];

export class UpdateObservationDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(TIPOS_OBSERVACAO)
  type?: TipoObservacao;
}
