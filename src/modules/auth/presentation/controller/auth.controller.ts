import { CurrentUser } from '../decorators/current-user.decorator';
import { Body, Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '../../useCases/login.usecase';
import { Public } from '../decorators/public.decorator';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authLogin: LoginUseCase
    ) { }

    @Public()
    @UseGuards(AuthGuard('local'))
    @Post('/login')
    @HttpCode(200)
    async login(@CurrentUser() user, @Body() loginDto: LoginDto) {
        return this.authLogin.execute(user, loginDto.companyId, loginDto.unitId);
    }
}
