import type {
  UpdateUserData,
  UserRepository,
} from './../domain/user.repository';
import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import { assertNaoEUltimoAdminAtivo } from '../domain/last-admin.guard';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly bcryptService: BcryptService,
  ) {}
  async execute(id: number, data: UpdateUserData): Promise<Partial<User>> {
    try {
      // RF06/RF23: SUPERVISOR so edita barbeiro, e nao pode promover ninguem
      // a outro papel. `data.userId` vem do InjectUserBodyInterceptor (JWT).
      if (data.userId) {
        const editor = await this.userRepository.getUserById(data.userId);
        if (editor?.role === 'SUPERVISOR') {
          const targetUser = await this.userRepository.getUserById(id);
          const alvoNaoEBarbeiro = targetUser?.role !== 'BARBER';
          const tentaTrocarParaOutroPapel =
            !!data.role && data.role !== 'BARBER';
          if (alvoNaoEBarbeiro || tentaTrocarParaOutroPapel) {
            throw new HttpException(
              'Supervisor só pode editar barbeiros.',
              HttpStatus.FORBIDDEN,
            );
          }
        }
      }

      // Sem ADMIN ninguem mais gerencia usuarios nem edita a loja: desativar
      // ou rebaixar o ultimo ADMIN trava a instalacao exatamente como
      // remove-lo (DeleteUserUseCase tem a mesma guarda).
      const desativando = data.active === false;
      const rebaixando = !!data.role && data.role !== 'ADMIN';
      if (desativando || rebaixando) {
        const targetUser = await this.userRepository.getUserById(id);

        // Um ADMIN nao se rebaixa/desativa sozinho por acidente, mesmo
        // havendo outros ADMINs ativos.
        if (targetUser?.role === 'ADMIN' && data.userId === id) {
          throw new HttpException(
            'Você não pode desativar ou alterar o seu próprio papel de administrador.',
            HttpStatus.FORBIDDEN,
          );
        }

        await assertNaoEUltimoAdminAtivo(
          this.userRepository,
          targetUser,
          'Não é possível desativar ou rebaixar o último administrador ativo.',
        );
      }

      // Bug de seguranca: PATCH aceitava passwordHash em texto puro e
      // gravava direto, sem hash — login quebrava depois.
      if (data.passwordHash) {
        data.passwordHash = await this.bcryptService.hashPassword(
          data.passwordHash,
        );
      }

      const user = await this.userRepository.updateUser(id, data);
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}
