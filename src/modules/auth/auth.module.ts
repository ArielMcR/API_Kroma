import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controller/auth.controller';
import { UsersModule } from '../users/users.module';
import { BcryptModule } from '../bcrypt/bcrypt.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from './useCases/login.usecase';
import { ValidateUserUseCase } from './useCases/validate-user.usecase';
import { LocalStrategy } from './infra/strategy/local.strategy';
import { JwtStrategy } from './infra/strategy/jwt.strategy';
import { RolesGuard } from './infra/guards/roles.guard';

@Module({
    imports: [UsersModule, BcryptModule, PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'defaultSecret',
            signOptions: { expiresIn: '1d' },
        })

    ],
    providers: [LoginUseCase, LocalStrategy, ValidateUserUseCase, JwtStrategy, RolesGuard],
    exports: [JwtModule, RolesGuard],
    controllers: [AuthController]
})
export class AuthModule { }
