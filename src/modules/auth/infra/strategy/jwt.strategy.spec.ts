import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from 'src/modules/users/domain/user.entity';
import type { UserRepository } from 'src/modules/users/domain/user.repository';
import { JwtStrategy } from './jwt.strategy';

// Ganchos que o passport injeta na strategy em tempo de execução; o teste os
// substitui para observar o resultado do `authenticate`.
type PassportHooks = {
  success: (user: unknown) => void;
  fail: (info: unknown) => void;
  error: (err: unknown) => void;
  authenticate: (req: unknown) => void;
};

type ResultadoAuth = {
  ok: boolean;
  user?: unknown;
  info?: unknown;
  err?: unknown;
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepoMock: jest.Mocked<Pick<UserRepository, 'getUserById'>>;
  let secretOriginal: string | undefined;

  // Nome e e-mail do token diferem do banco de propósito: o teste só passa se
  // o `request.user` vier do banco.
  const payload = {
    sub: 1,
    id: 1,
    name: 'nome antigo',
    email: 'antigo@b.com',
    role: 'BARBER',
  };

  const userDoBanco = {
    id: 1,
    name: 'barbeiro',
    email: 'b@b.com',
    role: 'BARBER',
    active: true,
  } as User;

  const doBanco = { id: 1, name: 'barbeiro', email: 'b@b.com', role: 'BARBER' };

  // Passa pelo passport-jwt de verdade: é ele que checaria assinatura e `exp`.
  const autenticar = (token: string) =>
    new Promise<ResultadoAuth>((resolve) => {
      const s = strategy as unknown as PassportHooks;
      s.success = (user: unknown) => resolve({ ok: true, user });
      s.fail = (info: unknown) => resolve({ ok: false, info });
      s.error = (err: unknown) => resolve({ ok: false, err });
      s.authenticate({ headers: { authorization: `Bearer ${token}` } });
    });

  beforeAll(() => {
    secretOriginal = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'segredo-de-teste';
  });

  afterAll(() => {
    if (secretOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretOriginal;
  });

  beforeEach(() => {
    userRepoMock = { getUserById: jest.fn().mockResolvedValue(userDoBanco) };
    strategy = new JwtStrategy(userRepoMock as unknown as UserRepository);
  });

  it('devolve id, name, email e role do banco para usuário ativo', async () => {
    const result = await strategy.validate(payload);

    expect(result).toEqual(doBanco);
    expect(userRepoMock.getUserById).toHaveBeenCalledWith(1);
  });

  it('usa a role do banco quando difere da do token (troca de papel vale na hora)', async () => {
    userRepoMock.getUserById.mockResolvedValue({
      ...userDoBanco,
      role: 'SUPERVISOR',
    });

    const result = await strategy.validate(payload);

    expect(result.role).toBe('SUPERVISOR');
  });

  it('rejeita usuário apagado ou inexistente', async () => {
    userRepoMock.getUserById.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita usuário inativo', async () => {
    userRepoMock.getUserById.mockResolvedValue({
      ...userDoBanco,
      active: false,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita payload sem id numérico sem consultar o banco', async () => {
    await expect(strategy.validate({})).rejects.toThrow(UnauthorizedException);
    expect(userRepoMock.getUserById).not.toHaveBeenCalled();
  });

  it('aceita token com exp vencido (emitido antes de remover a expiração)', async () => {
    const vencido = new JwtService({ secret: 'segredo-de-teste' }).sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    expect(await autenticar(vencido)).toEqual({ ok: true, user: doBanco });
  });

  it('recusa token assinado com outro segredo', async () => {
    const forjado = new JwtService({ secret: 'outro-segredo' }).sign(payload);

    expect(await autenticar(forjado)).toMatchObject({ ok: false });
    expect(userRepoMock.getUserById).not.toHaveBeenCalled();
  });

  it('responde 401 de ponta a ponta para usuário inativo com token válido', async () => {
    userRepoMock.getUserById.mockResolvedValue({
      ...userDoBanco,
      active: false,
    });
    const token = new JwtService({ secret: 'segredo-de-teste' }).sign(payload);

    const resultado = await autenticar(token);

    expect(resultado.ok).toBe(false);
    expect(resultado.err).toBeInstanceOf(UnauthorizedException);
  });
});
