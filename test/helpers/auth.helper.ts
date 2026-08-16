import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

type LoginResponseBody = { access_token: string };

export async function loginAsTestUser(
  app: INestApplication<App>,
  name: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ name, password });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      `Falha ao autenticar usuário de teste: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return (response.body as LoginResponseBody).access_token;
}
