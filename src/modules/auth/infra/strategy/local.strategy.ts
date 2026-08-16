import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/users/domain/user.entity';
import { ValidateUserUseCase } from '../../useCases/validate-user.usecase';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: ValidateUserUseCase) {
    super({
      usernameField: 'name',
      passwordField: 'password',
    });
  }

  async validate(name: string, password: string): Promise<User> {
    return this.authService.execute(name, password);
  }
}
