import { Inject, Injectable } from "@nestjs/common";
import type { UserRepository } from "../domain/user.repository";
import { UserDTO } from "../presentation/dtos/user.dto";

@Injectable()
export class FindByIdUserUseCase {
    constructor(
        @Inject("UserRepository")
        private readonly userRepository: UserRepository
    ) { }
    async execute(id: number, data: UserDTO): Promise<any> {
        try {
            const userData = {
                companyId: data.companyId,
                unitId: data.unitId,
                userId: data.userId
            };
            return await this.userRepository.getUserById(id, userData);
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }
}