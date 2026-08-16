import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  async execute(id: number): Promise<void> {
    try {
      await this.userRepository.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
