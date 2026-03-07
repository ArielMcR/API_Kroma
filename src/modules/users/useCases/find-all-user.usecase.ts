import { Inject, Injectable } from "@nestjs/common";
import type { UserRepository } from "../domain/user.repository";
import { UserDTO } from "../presentation/dtos/user.dto";

@Injectable()
export class FindAllUserUseCase {
    constructor(
        @Inject("UserRepository")
        private readonly userRepository: UserRepository
    ) { }
    async execute(data: UserDTO): Promise<any> {
        try {
            const userData = { ...data };
            return await this.userRepository.getAllUsers(userData);
        } catch (error) {
            console.error('Error finding all users:', error);
            throw error;
        }
    }
}