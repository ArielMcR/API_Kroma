import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class FindAllUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  async execute(): Promise<any> {
    try {
      return await this.userRepository.getAllUsers();
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }
}
