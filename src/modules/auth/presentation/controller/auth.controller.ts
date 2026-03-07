import { CurrentUser } from '../decorators/current-user.decorator';
import { Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '../../useCases/login.usecase';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authLogin: LoginUseCase
    ) {
    }

    @Public()
    @UseGuards(AuthGuard('local'))
    @Post('/login')
    @HttpCode(200)
    async login(@CurrentUser() user) {
        const jwtCode = await this.authLogin.execute(user);
        return { access_token: jwtCode };
    }
}
