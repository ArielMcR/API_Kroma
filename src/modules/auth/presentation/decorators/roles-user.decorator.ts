import { SetMetadata } from '@nestjs/common';

export const CURRENT_ROLES = 'roles';

/*
 * Aqui eu passo o decorator no método do controller, ai lá eu passo quais roles podem acessar aquela rota
 * ver arquivo de jwt-auth.guard.ts
 */
export const Roles = (...roles: string[]) => SetMetadata(CURRENT_ROLES, roles);
