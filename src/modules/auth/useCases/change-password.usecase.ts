import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isCurrentPasswordValid = await this.bcryptService.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new HttpException('Senha atual incorreta', HttpStatus.UNAUTHORIZED);
    }

    const passwordHash = await this.bcryptService.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
