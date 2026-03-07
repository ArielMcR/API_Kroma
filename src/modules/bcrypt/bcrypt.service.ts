import { Injectable } from '@nestjs/common';
import { BcryptUtils } from './bcrypt.utils';

@Injectable()
export class BcryptService {
    constructor(private readonly bcryptUtils: BcryptUtils) { }
    async hashPassword(password: string): Promise<string> {
        return this.bcryptUtils.hasPassword(password);
    }
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return this.bcryptUtils.comparePassword(password, hash);
    }
}
