import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { BcryptUtils } from './bcrypt.utils';

@Module({
    providers: [BcryptService, BcryptUtils],
    exports: [BcryptService, BcryptUtils],
})
export class BcryptModule { }
