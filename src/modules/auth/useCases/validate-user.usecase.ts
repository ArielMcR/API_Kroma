import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { User } from 'src/modules/users/domain/user.entity';
import type { UserRepository } from 'src/modules/users/domain/user.repository';

@Injectable()
export class ValidateUserUseCase {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly BLOCK_WINDOW_MINUTES = 15;

  constructor(
    private readonly bcryptService: BcryptService,
    private readonly prisma: PrismaService,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(name: string, password: string): Promise<User> {
    const cutoff = new Date(
      Date.now() - ValidateUserUseCase.BLOCK_WINDOW_MINUTES * 60 * 1000,
    );
    const recentFailures = await this.prisma.loginAttempt.count({
      where: { identifier: name, success: false, attemptedAt: { gte: cutoff } },
    });

    if (recentFailures >= ValidateUserUseCase.MAX_FAILED_ATTEMPTS) {
      throw new HttpException(
        'Acesso bloqueado temporariamente. Tente novamente em 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userRepository.getUserByName(name);
    const isPasswordValid =
      !!user?.passwordHash &&
      (await this.bcryptService.comparePassword(password, user.passwordHash));

    await this.prisma.loginAttempt.create({
      data: { identifier: name, success: !!isPasswordValid },
    });

    if (!user || !isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
