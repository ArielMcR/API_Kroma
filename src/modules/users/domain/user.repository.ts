import { User } from "./user.entity";
import { UserRoles } from "./user-roles.types";
import { UserData } from "./data/user.data";

export type CreateUserData = {
    name: string;
    email: string;
    passwordHash: string;
    role: keyof typeof UserRoles;
    companyId?: number | null;
    unitId?: number | null;
    creatorUserId: number;
    userId?: number | null;
}

export type UpdateUserData = Partial<CreateUserData>;

export interface UserRepository {
    createUser: (data: CreateUserData) => Promise<Partial<User>>;
    findByEmail: (email: string) => Promise<User | null>;
    getUserById: (id: number, data: UserData) => Promise<User | null>;
    getAllUsers: (data: UserData) => Promise<Partial<User>[]>;
    updateUser: (id: number, data: UpdateUserData) => Promise<Partial<User>>;
    deleteUser: (id: number, data: UserData) => Promise<void>;
    getUserByNameAndEmpresaId: (name: string, companyId: number, unitId: number) => Promise<User | null>;
}