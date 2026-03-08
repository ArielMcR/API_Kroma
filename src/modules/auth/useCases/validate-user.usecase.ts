import { HttpException, Inject, Injectable } from "@nestjs/common";
import { BcryptService } from "src/modules/bcrypt/bcrypt.service";
import { User } from "src/modules/users/domain/user.entity";
import type { UserRepository } from "src/modules/users/domain/user.repository";

@Injectable()
export class ValidateUserUseCase {
    constructor(
        private readonly bcryptService: BcryptService,
        @Inject("UserRepository")
        private readonly userRepository: UserRepository,
    ) { }

    async execute(name: string, password: string): Promise<User> {
        const user = await this.userRepository.getUserByName(name);
        if (!user || !user.passwordHash) {
            throw new HttpException('Invalid credentials', 401);
        }
        const isPasswordValid = await this.bcryptService.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new HttpException('Invalid credentials', 401);
        }
        return user;
    }
}