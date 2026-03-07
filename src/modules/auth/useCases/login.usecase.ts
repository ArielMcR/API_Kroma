import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/modules/users/domain/user.entity";

@Injectable()
export class LoginUseCase {
    constructor(private jwtService: JwtService) { }
    async execute(user: User): Promise<string> {
        return this.jwtService.sign({ ...user, sub: user.id });
    }
}