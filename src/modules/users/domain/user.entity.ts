import { UserRoles } from './user-roles.types';
import { Default } from 'src/modules/common/domain/default/default.domain';

export class User extends Default {
  id!: number;
  name!: string;
  email!: string;
  passwordHash!: string;
  role!: keyof typeof UserRoles;
  active!: boolean;
}
