import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class MeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.active) {
      throw new HttpException(
        'Usuario invalido ou inativo',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const settings = await this.prisma.settings.findFirst();

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      settings,
    };
  }
}
