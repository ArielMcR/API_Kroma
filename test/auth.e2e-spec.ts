import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import {
  cleanupTestDatabase,
  seedTestDatabase,
  type SeededData,
} from './helpers/seed.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seeded: SeededData;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    seeded = await seedTestDatabase(prisma);
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma, seeded);
    await app.close();
  });

  it('POST /auth/login com credenciais válidas retorna 200 e o token de acesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: seeded.adminName, password: seeded.adminPassword });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
  });

  it('POST /auth/login com credenciais inválidas retorna 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: seeded.adminName, password: 'senha-incorreta' });

    expect(response.status).toBe(401);
  });

  it('PATCH /auth/change-password com senha atual correta retorna 200', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: seeded.adminName, password: seeded.adminPassword });
    const token = (login.body as { access_token: string }).access_token;

    const novaSenha = 'nova-senha-123';
    const response = await request(app.getHttpServer())
      .patch('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: seeded.adminPassword, newPassword: novaSenha });

    expect(response.status).toBe(200);

    // Confirma que o login passa a exigir a nova senha
    const novoLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ name: seeded.adminName, password: novaSenha });
    expect(novoLogin.status).toBe(200);

    seeded = { ...seeded, adminPassword: novaSenha };
  });

  it('POST /auth/login bloqueia após 6 tentativas consecutivas com senha incorreta (RF20 → HTTP 429)', async () => {
    const nome = `bloqueio-${Date.now()}`;
    await prisma.user.create({
      data: {
        name: nome,
        email: `${nome}@barbearia.com`,
        passwordHash:
          '$2b$04$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinval',
        role: 'BARBER',
      },
    });

    let lastStatus = 0;
    for (let tentativa = 1; tentativa <= 6; tentativa++) {
      const attemptResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: nome, password: 'senha-errada' });
      lastStatus = attemptResponse.status;
    }

    expect(lastStatus).toBe(429);

    await prisma.loginAttempt.deleteMany({ where: { identifier: nome } });
    await prisma.user.deleteMany({ where: { name: nome } });
  });
});
