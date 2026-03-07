import { Inject, Injectable } from "@nestjs/common";
import type { UserRepository } from "../domain/user.repository";
import { User } from "../domain/user.entity";

@Injectable()
export class FindByNameAndEmpresaUseCase {
    constructor(@Inject("UserRepository") private readonly userRepository: UserRepository) { }

    async execute(name: string, companyId: number, unitId: number): Promise<User | null> {
        const user = await this.userRepository.getUserByNameAndEmpresaId(name, companyId, unitId);
        return user;
    }
}