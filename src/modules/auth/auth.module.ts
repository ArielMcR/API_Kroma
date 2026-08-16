import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controller/auth.controller';
import { UsersModule } from '../users/users.module';
import { BcryptModule } from '../bcrypt/bcrypt.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './useCases/login.usecase';
import { ValidateUserUseCase } from './useCases/validate-user.usecase';
import { ChangePasswordUseCase } from './useCases/change-password.usecase';
import { MeUseCase } from './useCases/me.usecase';
import { LocalStrategy } from './infra/strategy/local.strategy';
import { JwtStrategy } from './infra/strategy/jwt.strategy';
import { RolesGuard } from './infra/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    BcryptModule,
    PassportModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    LoginUseCase,
    LocalStrategy,
    ValidateUserUseCase,
    ChangePasswordUseCase,
    MeUseCase,
    JwtStrategy,
    RolesGuard,
  ],
  exports: [JwtModule, RolesGuard],
  controllers: [AuthController],
})
export class AuthModule {}
