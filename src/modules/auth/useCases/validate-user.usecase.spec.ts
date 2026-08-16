import { HttpException } from '@nestjs/common';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import type { UserRepository } from 'src/modules/users/domain/user.repository';
import { ValidateUserUseCase } from './validate-user.usecase';

describe('ValidateUserUseCase', () => {
  let useCase: ValidateUserUseCase;
  let bcryptServiceMock: jest.Mocked<
    Pick<BcryptService, 'comparePassword' | 'hashPassword'>
  >;
  let prismaMock: { loginAttempt: { count: jest.Mock; create: jest.Mock } };
  let userRepoMock: jest.Mocked<Pick<UserRepository, 'getUserByName'>>;

  const user = {
    id: 1,
    name: 'barbeiro',
    passwordHash: 'hash-da-senha',
  } as any;

  beforeEach(() => {
    bcryptServiceMock = {
      comparePassword: jest.fn(),
      hashPassword: jest.fn(),
    };
    prismaMock = {
      loginAttempt: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    userRepoMock = {
      getUserByName: jest.fn().mockResolvedValue(user),
    };

    useCase = new ValidateUserUseCase(
      bcryptServiceMock as unknown as BcryptService,
      prismaMock as unknown as PrismaService,
      userRepoMock as unknown as UserRepository,
    );
  });

  it('autentica com senha correta', async () => {
    bcryptServiceMock.comparePassword.mockResolvedValue(true);

    const result = await useCase.execute('barbeiro', 'senha-correta');

    expect(result).toBe(user);
    expect(prismaMock.loginAttempt.create).toHaveBeenCalledWith({
      data: { identifier: 'barbeiro', success: true },
    });
  });

  it('rejeita senha incorreta e registra a tentativa como falha', async () => {
    bcryptServiceMock.comparePassword.mockResolvedValue(false);

    await expect(useCase.execute('barbeiro', 'senha-errada')).rejects.toThrow(
      'Invalid credentials',
    );
    expect(prismaMock.loginAttempt.create).toHaveBeenCalledWith({
      data: { identifier: 'barbeiro', success: false },
    });
  });

  it('bloqueia o acesso após 5 tentativas falhas (RF20)', async () => {
    prismaMock.loginAttempt.count.mockResolvedValue(5);

    await expect(useCase.execute('barbeiro', 'qualquer-coisa')).rejects.toThrow(
      'Acesso bloqueado temporariamente. Tente novamente em 15 minutos.',
    );
    await expect(useCase.execute('barbeiro', 'qualquer-coisa')).rejects.toThrow(
      HttpException,
    );
    expect(userRepoMock.getUserByName).not.toHaveBeenCalled();
  });

  it('considera apenas tentativas falhas dos últimos 15 minutos ao decidir o bloqueio (libera após a janela)', async () => {
    prismaMock.loginAttempt.count.mockResolvedValue(0);
    bcryptServiceMock.comparePassword.mockResolvedValue(true);
    const antes = Date.now();

    await useCase.execute('barbeiro', 'senha-correta');

    const [[whereArg]] = prismaMock.loginAttempt.count.mock.calls;
    expect(whereArg.where.identifier).toBe('barbeiro');
    expect(whereArg.where.success).toBe(false);
    const cutoff: Date = whereArg.where.attemptedAt.gte;
    const minutosAteAgora = (antes - cutoff.getTime()) / (60 * 1000);
    expect(minutosAteAgora).toBeGreaterThanOrEqual(14.9);
    expect(minutosAteAgora).toBeLessThanOrEqual(15.1);
  });
});
