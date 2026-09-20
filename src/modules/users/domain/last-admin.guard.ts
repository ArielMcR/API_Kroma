import { HttpException, HttpStatus } from '@nestjs/common';
import type { UserRepository } from './user.repository';
import type { User } from './user.entity';

/**
 * RN: a instalação nunca pode ficar sem ADMIN ativo — sem ele ninguém mais
 * gerencia usuários nem edita a loja. Vale tanto para remover (soft delete)
 * quanto para desativar/rebaixar (`active: false` ou `role !== 'ADMIN'`) o
 * último ADMIN, então Delete e Update compartilham esta guarda.
 */
export async function assertNaoEUltimoAdminAtivo(
  userRepository: UserRepository,
  targetUser: User | null,
  message: string,
): Promise<void> {
  if (targetUser?.role !== 'ADMIN') return;

  const activeAdmins = await userRepository.countActiveAdmins();
  if (activeAdmins <= 1) {
    throw new HttpException(message, HttpStatus.FORBIDDEN);
  }
}
