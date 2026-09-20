import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserRoles } from '../../domain/user-roles.types';
import { PartialType } from '@nestjs/mapped-types';
import { UserDTO } from './user.dto';

export class CreateUserDTO extends PartialType(UserDTO) {
  @IsNotEmpty({ message: 'O campo nome é obrigatório' })
  @IsString()
  readonly name!: string;

  @IsNotEmpty({ message: 'O campo email é obrigatório' })
  @IsString()
  @IsEmail({}, { message: 'O campo email deve ser um email válido' })
  readonly email!: string;

  @IsNotEmpty({ message: 'O campo senha é obrigatório' })
  @IsString()
  readonly passwordHash!: string;

  @IsNotEmpty({ message: 'O campo role é obrigatório' })
  @IsString()
  readonly role!: keyof typeof UserRoles;

  // Quem criou o usuário vem só do JWT (`userId` injetado pelo
  // InjectUserBodyInterceptor) — não existe campo de `creatorUserId` no
  // contrato porque aceitar esse dado do cliente permite escalonar
  // privilégio (RN de segurança).
}
