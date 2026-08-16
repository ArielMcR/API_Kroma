import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class FindByIdUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  async execute(id: number): Promise<any> {
    try {
      return await this.userRepository.getUserById(id);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }
}
