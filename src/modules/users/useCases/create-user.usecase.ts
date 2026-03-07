import { Inject, Injectable } from "@nestjs/common";
import type { CreateUserData, UserRepository } from "../domain/user.repository";
import { User } from "../domain/user.entity";
import { UnauthorizedUserCreationException } from "../domain/exceptions/unauthorized.exception";
import { CreateUserDTO } from "../presentation/dtos/create-user.dto";
import { BcryptService } from "src/modules/bcrypt/bcrypt.service";

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject("UserRepository")
        private readonly userRepository: UserRepository,
        private readonly bcryptService: BcryptService
    ) { }

    async execute(data: CreateUserDTO): Promise<Partial<User>> {
        const creatorUser = await this.userRepository.getUserById(data.creatorUserId, {
            companyId: data.companyId!,
            unitId: data.unitId!,
            userId: data.creatorUserId
        });

        if (!creatorUser) {
            throw new UnauthorizedUserCreationException('Usuário criador não encontrado');
        }

        const passwordHash = await this.bcryptService.hashPassword(data.passwordHash);
        const userData: CreateUserData = {
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            companyId: data.companyId,
            unitId: data.unitId,
            creatorUserId: data.creatorUserId,
            userId: data.userId
        };

        return await this.userRepository.createUser(userData);
    }
}
