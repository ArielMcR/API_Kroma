import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { User } from 'src/modules/users/domain/user.entity';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(user: User) {
    const access_token = this.jwtService.sign({
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const settings = await this.prisma.settings.findFirst();

    return {
      access_token,
      settings,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
