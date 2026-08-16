import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './useCases/create-user.usecase';
import { UpdateUserUseCase } from './useCases/update-user.usecase';
import { FindAllUserUseCase } from './useCases/find-all-user.usecase';
import { FindByIdUserUseCase } from './useCases/find-by-id-user.usecase';
import { PrismaUserRepository } from './infra/prisma-users.prima';
import { PrismaModule } from '../prisma/prisma.module';
import { DeleteUserUseCase } from './useCases/delete-user.useCase';
import { BcryptModule } from '../bcrypt/bcrypt.module';
import { UsersController } from './presentation/controller/user.controller';

@Module({
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase,
    FindAllUserUseCase,
    FindByIdUserUseCase,
    DeleteUserUseCase,
    { provide: 'UserRepository', useClass: PrismaUserRepository },
  ],
  imports: [PrismaModule, BcryptModule],
  exports: [{ provide: 'UserRepository', useClass: PrismaUserRepository }],
})
export class UsersModule {}
