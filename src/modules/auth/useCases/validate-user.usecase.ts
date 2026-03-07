import { HttpException, Injectable } from "@nestjs/common";
import { BcryptService } from "src/modules/bcrypt/bcrypt.service";
import { FindByNameAndEmpresaUseCase } from "src/modules/users/useCases/find-by-name-and-empresa.usecase";

@Injectable()
export class ValidateUserUseCase {
    constructor(
        private readonly bcryptService: BcryptService,
        private readonly findByNameAndEmpresaUseCase: FindByNameAndEmpresaUseCase,
    ) { }
    async execute(name: string, password: string, companyId: number, unitId: number): Promise<any> {
        const user = await this.findByNameAndEmpresaUseCase.execute(name, companyId, unitId);
        if (user && user.passwordHash != null) {
            const isPasswordValid = await this.bcryptService.comparePassword(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new HttpException('Invalid credentials', 401);
            }
        }
        return user;
    }
}