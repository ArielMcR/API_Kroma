
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/modules/users/domain/user.entity';
import { ValidateUserUseCase } from '../../useCases/validate-user.usecase';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: ValidateUserUseCase) {
        super({
            usernameField: 'name',
            passwordField: 'password',
            passReqToCallback: true,
        });
    }

    async validate(req: Request, name: string, password: string): Promise<User> {
        const companyId = Number(req.body.companyId!);
        const unitId = Number(req.body.unitId!);
        const user = await this.authService.execute(name, password, companyId, unitId);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
