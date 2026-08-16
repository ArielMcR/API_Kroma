import { PrismaService } from 'src/modules/prisma/prisma.service';
import { User } from '../domain/user.entity';
import {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from '../domain/user.repository';
import { Injectable } from '@nestjs/common';
import { handlePrismaError } from 'src/modules/common/infra/prisma-error.handler';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserData): Promise<Partial<User>> {
    try {
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          creatorUserId: data.creatorUserId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user as User | null;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user as User | null;
  }

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        deletedAt: null,
      },
    });
    return users;
  }

  async updateUser(id: number, data: UpdateUserData): Promise<Partial<User>> {
    try {
      delete data.userId;
      return await this.prisma.user.update({
        where: {
          id,
          deletedAt: null,
        },
        data: { ...data, updatedAt: new Date() },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: {
          id,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUserByName(name: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { name, deletedAt: null, active: true },
    });
    return user as User | null;
  }
}
