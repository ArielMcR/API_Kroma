import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';
import { assertNaoEUltimoAdminAtivo } from '../domain/last-admin.guard';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}
  async execute(id: number, currentUserId?: number): Promise<void> {
    try {
      // Soft delete nao tem "desfazer" pela API: sem ADMIN ninguem mais cria
      // usuario nem edita a loja, entao a instalacao trava.
      if (currentUserId && id === currentUserId) {
        throw new HttpException(
          'Você não pode remover o próprio usuário.',
          HttpStatus.FORBIDDEN,
        );
      }

      const targetUser = await this.userRepository.getUserById(id);

      // RF06/RF23: SUPERVISOR so remove barbeiro. `currentUserId` vem do
      // @CurrentUser() no controller (JWT), nao do body.
      if (currentUserId) {
        const editor = await this.userRepository.getUserById(currentUserId);
        if (editor?.role === 'SUPERVISOR' && targetUser?.role !== 'BARBER') {
          throw new HttpException(
            'Supervisor só pode remover barbeiros.',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      await assertNaoEUltimoAdminAtivo(
        this.userRepository,
        targetUser,
        'Não é possível remover o último administrador ativo.',
      );

      await this.userRepository.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
