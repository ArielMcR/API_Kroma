import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { FindSettingsUseCase } from '../../useCases/find-settings.usecase';
import { UpdateSettingsUseCase } from '../../useCases/update-settings.usecase';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly find: FindSettingsUseCase,
    private readonly update: UpdateSettingsUseCase,
  ) {}

  @Get()
  async get_() {
    return this.find.execute();
  }

  @Patch()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async update_(@Body() data: UpdateSettingsDto) {
    return this.update.execute(data);
  }
}
