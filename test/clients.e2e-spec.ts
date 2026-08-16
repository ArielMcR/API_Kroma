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

describe('Clients (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seeded: SeededData;
  let token: string;
  let createdClientId: number;

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

  it('POST /clients cria cliente e retorna 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Novo',
        lastName: `Cliente ${seeded.suffix}`,
        cellPhone: '11977776666',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    createdClientId = (response.body as { id: number }).id;
  });

  it('GET /clients retorna a lista de clientes', async () => {
    const response = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const clientes = response.body as Array<{ id: number }>;
    expect(clientes.some((cliente) => cliente.id === createdClientId)).toBe(
      true,
    );
  });

  it('GET /clients/:id retorna o cliente específico', async () => {
    const response = await request(app.getHttpServer())
      .get(`/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', createdClientId);
  });

  it('PATCH /clients/:id atualiza o cliente', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado' });

    expect(response.status).toBe(200);

    const atualizado = await prisma.client.findUnique({
      where: { id: createdClientId },
    });
    expect(atualizado?.name).toBe('Nome Atualizado');
  });

  it('DELETE /clients/:id realiza soft delete (mantém o registro com deletedAt preenchido)', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/clients/${createdClientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    const removido = await prisma.client.findUnique({
      where: { id: createdClientId },
    });
    expect(removido).not.toBeNull();
    expect(removido?.deletedAt).not.toBeNull();
  });
});
