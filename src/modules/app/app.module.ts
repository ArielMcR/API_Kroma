import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from '../clients/clients.module';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiExceptionFilter } from '../common/filters/exception.filters';
import { BcryptModule } from '../bcrypt/bcrypt.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/infra/guards/jwt-auth.guard';
import { InjectUserBodyInterceptor } from '../common/presentation/interceptors/inject-user-body.interceptor';
import { CompanyModule } from '../company/company.module';
import { UnitsModule } from '../units/units.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [ClientsModule, UsersModule, ServicesModule, BcryptModule, AuthModule, CompanyModule, UnitsModule, AppointmentsModule, ProductsModule, SalesModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: InjectUserBodyInterceptor },
  ],
})
export class AppModule { }
