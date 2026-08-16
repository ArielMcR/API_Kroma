import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/modules/app/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { loginAsTestUser } from './helpers/auth.helper';
import {
  cleanupTestDatabase,
  seedTestDatabase,
  type SeededData,
} from './helpers/seed.helper';

describe('Observations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seeded: SeededData;
  let token: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    seeded = await seedTestDatabase(prisma);
    token = await loginAsTestUser(app, seeded.adminName, seeded.adminPassword);
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma, seeded);
    await app.close();
  });

  it('POST /observations cria observação para cliente existente', async () => {
    const response = await request(app.getHttpServer())
      .post('/observations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: seeded.clientId,
        content: 'Cliente prefere atendimento pela manhã',
        type: 'PREFERENCIA',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect((response.body as { clientId: number }).clientId).toBe(
      seeded.clientId,
    );
  });

  it('GET /observations/client/:id retorna as observações do cliente', async () => {
    const response = await request(app.getHttpServer())
      .get(`/observations/client/${seeded.clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const observacoes = response.body as Array<{ clientId: number }>;
    expect(observacoes.length).toBeGreaterThan(0);
    expect(observacoes[0]).toHaveProperty('clientId', seeded.clientId);
  });
});
