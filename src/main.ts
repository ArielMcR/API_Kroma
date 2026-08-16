/**
 * PRECISA ser o primeiro import do arquivo.
 *
 * O app nunca carregou o proprio `.env`: nao ha ConfigModule nem dotenv em
 * lugar nenhum. O que enchia `process.env` era um EFEITO COLATERAL do
 * `@prisma/client`, que le o `.env` ao ser importado. Onde o Prisma nao acha o
 * schema (deploy com layout diferente, client nao gerado), nada e carregado e
 * a aplicacao sobe sem JWT_SECRET nem GEMINI_API_KEY.
 *
 * Tem de vir antes de `AppModule` porque `JwtModule.register({ secret:
 * process.env.JWT_SECRET })` e avaliado na hora do IMPORT do auth.module, e
 * nao na inicializacao do Nest — o CommonJS executa os requires em ordem.
 */
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({}));
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie',
    ],
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
