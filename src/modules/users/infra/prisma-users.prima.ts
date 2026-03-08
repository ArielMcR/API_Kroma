import { PrismaService } from "src/modules/prisma/prisma.service";
import { User } from "../domain/user.entity";
import { CreateUserData, UpdateUserData, UserRepository } from "../domain/user.repository";
import { HttpException, Injectable } from "@nestjs/common";
import { UserData } from "../domain/data/user.data";

@Injectable()
export class PrismaUserRepository implements UserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createUser(data: CreateUserData): Promise<Partial<User>> {
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
                role: data.role,
                companyId: data.companyId,
                unitId: data.unitId,
                creatorUserId: data.creatorUserId
            },
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                unit: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email }, select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                role: true,
                companyId: true,
                unitId: true,
                company: true,
                unit: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user as User | null;
    }

    async getUserById(id: number, data: UserData): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id, deletedAt: null, companyId: data.companyId, unitId: data.unitId }, select: {
                id: true,
                name: true,
                email: true,
                company: true,
                unit: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user as User | null;
    }

    async getAllUsers(data: UserData): Promise<Partial<User>[]> {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                company: true,
                unit: true,
                createdAt: true,
                updatedAt: true
            },
            where: { deletedAt: null, companyId: data.companyId, unitId: data.unitId }
        });
        return users;
    }

    async updateUser(id: number, data: UpdateUserData): Promise<Partial<User>> {
        try {
            const { companyId, unitId, userId, ...updateData } = data;
            console.log('Updating user with ID:', data);
            console.log('Update data:', updateData);
            const user = await this.prisma.user.update({
                where: { id, deletedAt: null, companyId: data.companyId, unitId: data.unitId },
                data: { ...updateData, updatedAt: new Date() },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    company: true,
                    unit: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return user;
        } catch (error) {
            throw new HttpException('An error occurred while updating the user', 404);
        }
    }

    async deleteUser(id: number, data: UserData): Promise<void> {
        await this.prisma.user.update({
            where: { id, companyId: data.companyId, unitId: data.unitId, deletedAt: null },
            data: { deletedAt: new Date() }
        });
    }

    async getUserByNameAndEmpresaId(name: string, companyId: number, unitId: number): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: { name, companyId, unitId, deletedAt: null, active: true }
        });
        if (!user) throw new HttpException('User not found', 404);
        return user as User | null;
    }

    async getUserByName(name: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: { name, deletedAt: null, active: true }
        });
        return user as User | null;
    }
}