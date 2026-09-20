import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { CreateUserData, UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { UnauthorizedUserCreationException } from '../domain/exceptions/unauthorized.exception';
import { CreateUserDTO } from '../presentation/dtos/create-user.dto';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(data: CreateUserDTO): Promise<Partial<User>> {
    // O criador vem só do JWT (`userId` injetado pelo InjectUserBodyInterceptor).
    // Nunca aceitar esse dado do cliente: um `creatorUserId` no body permitia
    // a um SUPERVISOR se passar por um ADMIN e escalar privilégio.
    const creatorUserId = data.userId;

    if (!creatorUserId) {
      throw new HttpException(
        'Não foi possível identificar o usuário responsável pela criação.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const creatorUser = await this.userRepository.getUserById(creatorUserId);

    if (!creatorUser) {
      throw new UnauthorizedUserCreationException(
        'Usuário criador não encontrado',
      );
    }

    // RF06/RF23: SUPERVISOR cadastra usuario, mas so barbeiro — ADMIN
    // continua podendo criar qualquer papel.
    if (creatorUser.role === 'SUPERVISOR' && data.role !== 'BARBER') {
      throw new HttpException(
        'Supervisor só pode cadastrar barbeiros.',
        HttpStatus.FORBIDDEN,
      );
    }

    const passwordHash = await this.bcryptService.hashPassword(
      data.passwordHash,
    );
    const userData: CreateUserData = {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      creatorUserId,
      userId: data.userId,
    };

    return await this.userRepository.createUser(userData);
  }
}
