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

const proximaSextaOuSabado = (): string => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 5 && date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
};

const proximoDomingo = (): string => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
};

describe('Appointments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let seeded: SeededData;
  let token: string;
  const dataValida = proximaSextaOuSabado();
  let appointmentId: number;

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

  it('POST /appointments cria agendamento válido', async () => {
    const response = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: seeded.clientId,
        serviceIds: [seeded.serviceId],
        professionalId: seeded.adminUserId,
        appointmentDate: dataValida,
        startTime: '09:00',
        status: 'SCHEDULED',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    appointmentId = (response.body as { id: number }).id;
  });

  it('POST /appointments rejeita conflito de horário (409)', async () => {
    const response = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: seeded.clientId,
        serviceIds: [seeded.serviceId],
        professionalId: seeded.adminUserId,
        appointmentDate: dataValida,
        startTime: '09:00',
        status: 'SCHEDULED',
      });

    expect(response.status).toBe(409);
    expect((response.body as { message: string }).message).toContain(
      'agendamento neste horário',
    );
  });

  it('POST /appointments rejeita dia não permitido (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: seeded.clientId,
        serviceIds: [seeded.serviceId],
        professionalId: seeded.adminUserId,
        appointmentDate: proximoDomingo(),
        startTime: '09:00',
        status: 'SCHEDULED',
      });

    expect(response.status).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      'segunda a sábado',
    );
  });

  it('GET /appointments retorna os agendamentos do profissional autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/appointments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const agendamentos = response.body as Array<{ id: number }>;
    expect(
      agendamentos.some((agendamento) => agendamento.id === appointmentId),
    ).toBe(true);
  });

  it('POST /appointments/:id/cancel cancela o agendamento e libera o horário', async () => {
    const cancelResponse = await request(app.getHttpServer())
      .post(`/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelResponse.status).toBe(201);
    expect((cancelResponse.body as { status: string }).status).toBe(
      'CANCELLED',
    );

    // Como o agendamento cancelado é ignorado na checagem de conflito, o mesmo horário volta a ficar disponível
    const novoResponse = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: seeded.clientId,
        serviceIds: [seeded.serviceId],
        professionalId: seeded.adminUserId,
        appointmentDate: dataValida,
        startTime: '09:00',
        status: 'SCHEDULED',
      });

    expect(novoResponse.status).toBe(201);
  });
});
