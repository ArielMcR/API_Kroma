import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { DeleteUserUseCase } from '../../useCases/delete-user.useCase';
import { CreateUserUseCase } from '../../useCases/create-user.usecase';
import { UpdateUserUseCase } from '../../useCases/update-user.usecase';
import { FindAllUserUseCase } from '../../useCases/find-all-user.usecase';
import { FindByIdUserUseCase } from '../../useCases/find-by-id-user.usecase';
import { Roles } from 'src/modules/auth/presentation/decorators/roles-user.decorator';
import { RolesGuard } from 'src/modules/auth/infra/guards/roles.guard';
import { UpdateUserDTO } from '../dtos/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly findAllUserUseCase: FindAllUserUseCase,
    private readonly findByIdUserUseCase: FindByIdUserUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async createUser(@Body() user: CreateUserDTO) {
    try {
      return await this.createUserUseCase.execute(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  @Get()
  async findAllUsers() {
    try {
      return await this.findAllUserUseCase.execute();
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  @Get(':id')
  async findUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.findByIdUserUseCase.execute(id);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDTO,
  ) {
    try {
      return await this.updateUserUseCase.execute(id, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteUserUseCase.execute(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
