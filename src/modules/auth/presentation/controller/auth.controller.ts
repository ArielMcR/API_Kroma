import { CurrentUser } from '../decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginUseCase } from '../../useCases/login.usecase';
import { Public } from '../decorators/public.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangePasswordUseCase } from '../../useCases/change-password.usecase';
import { MeUseCase } from '../../useCases/me.usecase';
import type { UserAuthDto } from '../dto/user-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authLogin: LoginUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly meUseCase: MeUseCase,
  ) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('/login')
  @HttpCode(200)
  async login(@CurrentUser() user) {
    return this.authLogin.execute(user);
  }

  @Get('/me')
  async me(@CurrentUser() user: UserAuthDto) {
    return this.meUseCase.execute(user.id);
  }

  @Patch('/change-password')
  async changePassword_(
    @CurrentUser() user: UserAuthDto,
    @Body() data: ChangePasswordDto,
  ) {
    return this.changePassword.execute(
      user.id,
      data.currentPassword,
      data.newPassword,
    );
  }
}
