import { User } from './user.entity';
import { UserRoles } from './user-roles.types';

export type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
  role: keyof typeof UserRoles;
  creatorUserId: number;
  userId?: number | null;
};

export type UpdateUserData = Partial<CreateUserData>;

export interface UserRepository {
  createUser: (data: CreateUserData) => Promise<Partial<User>>;
  findByEmail: (email: string) => Promise<User | null>;
  getUserById: (id: number) => Promise<User | null>;
  getAllUsers: () => Promise<Partial<User>[]>;
  updateUser: (id: number, data: UpdateUserData) => Promise<Partial<User>>;
  deleteUser: (id: number) => Promise<void>;
  getUserByName: (name: string) => Promise<User | null>;
}
