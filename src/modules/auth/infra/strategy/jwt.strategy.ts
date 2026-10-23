import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { obterJwtSecret } from 'src/modules/auth/domain/jwt-secret';
import { User } from 'src/modules/users/domain/user.entity';
import type { UserRepository } from 'src/modules/users/domain/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: obterJwtSecret(),
      // Tokens emitidos antes de 2026-10-22 carregam `exp` de 1 dia, e o app
      // publicado nao trata 401 com a sessao aberta. Ignorar o `exp` mantem
      // essas sessoes vivas sem atualizar o app.
      ignoreExpiration: true,
    });
  }

  // Sem expiracao, esta consulta e a unica revogacao: usuario apagado ou
  // desativado perde o acesso na hora, e o papel vem do banco, nao do token.
  async validate(payload: { id?: unknown }): Promise<Partial<User>> {
    // Sem `id` numerico o Prisma estouraria a validacao e a resposta viraria 500.
    const user =
      typeof payload.id === 'number'
        ? await this.userRepository.getUserById(payload.id)
        : null;

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuario invalido ou inativo');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
