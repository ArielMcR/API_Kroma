/**
 * Segredo de assinatura do JWT, lido de um lugar so.
 *
 * Antes cada ponto tratava a ausencia de um jeito diferente:
 *
 * - `JwtModule.register` caia em `'defaultSecret'`, uma constante publica no
 *   repositorio. Em producao isso e pior que falhar: a API sobe funcionando e
 *   qualquer pessoa com acesso ao codigo forja um token valido.
 * - `JwtStrategy` usava `process.env.JWT_SECRET!`, e o passport-jwt estourava
 *   com "JwtStrategy requires a secret or key" — que nao diz qual variavel
 *   falta nem onde defini-la.
 *
 * Falhar cedo, dizendo o nome da variavel, e mais seguro que os dois.
 */
export function obterJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      'JWT_SECRET ausente ou vazio. Defina no arquivo .env da raiz da API ' +
        '(ou como variavel de ambiente) antes de iniciar o servidor.',
    );
  }

  return secret;
}
