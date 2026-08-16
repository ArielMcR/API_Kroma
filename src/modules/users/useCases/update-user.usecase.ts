import type {
  UpdateUserData,
  UserRepository,
} from './../domain/user.repository';
import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  async execute(id: number, data: UpdateUserData): Promise<Partial<User>> {
    try {
      const user = await this.userRepository.updateUser(id, data);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}
