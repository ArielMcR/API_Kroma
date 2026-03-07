import { Inject, Injectable } from "@nestjs/common";
import type { UserRepository } from "../domain/user.repository";
import { UserDTO } from "../presentation/dtos/user.dto";

@Injectable()
export class DeleteUserUseCase {
    constructor(
        @Inject("UserRepository")
        private readonly userRepository: UserRepository
    ) { }
    async execute(id: number, data: UserDTO): Promise<void> {
        try {
            const userData = {
                companyId: data.companyId,
                userId: data.userId,
                unitId: data.unitId
            }
            await this.userRepository.deleteUser(id, userData);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}