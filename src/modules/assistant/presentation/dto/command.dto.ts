import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CommandDto {
  @IsString()
  @IsNotEmpty({ message: 'O comando não pode ser vazio' })
  // Teto de tamanho: a entrada vai direto para o LLM e e cobrada por token.
  @MaxLength(1000, {
    message: 'O comando é longo demais (máximo 1000 caracteres)',
  })
  text: string;
}
