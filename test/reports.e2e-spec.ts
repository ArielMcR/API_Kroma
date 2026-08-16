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

describe('Reports (e2e)', () => {
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

    const hoje = new Date();
    hoje.setHours(10, 0, 0, 0);
    await prisma.appointment.create({
      data: {
        clientId: seeded.clientId,
        services: {
          create: [{
            serviceId: seeded.serviceId,
            unitPrice: 50,
            durationMinutes: 30,
            position: 0,
          }],
        },
        professionalId: seeded.adminUserId,
        appointmentDate: hoje,
        startTime: '10:00',
        endTime: '10:30',
        status: 'COMPLETED',
        durationMinutes: 30,
      },
    });
    await prisma.appointment.create({
      data: {
        clientId: seeded.clientId,
        services: {
          create: [{
            serviceId: seeded.serviceId,
            unitPrice: 50,
            durationMinutes: 30,
            position: 0,
          }],
        },
        professionalId: seeded.adminUserId,
        appointmentDate: hoje,
        startTime: '11:00',
        endTime: '11:30',
        status: 'CANCELLED',
        durationMinutes: 30,
        cancelledLate: true,
        chargeRegistered: true,
        chargeAmount: 50,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma, seeded);
    await app.close();
  });

  const periodoDoMes = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = now.toISOString();
    return `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  };

  it('GET /reports/attendance retorna dados agregados de atendimento no período', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reports/attendance${periodoDoMes()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalAppointments');
    expect(response.body).toHaveProperty('completed');
    expect(response.body).toHaveProperty('cancelled');
    const attendance = response.body as {
      totalAppointments: number;
      completed: number;
      cancelled: number;
    };
    expect(attendance.totalAppointments).toBeGreaterThanOrEqual(2);
    expect(attendance.completed).toBeGreaterThanOrEqual(1);
    expect(attendance.cancelled).toBeGreaterThanOrEqual(1);
  });

  it('GET /reports/revenue retorna o faturamento correto (concluídos + cobranças por cancelamento tardio)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/reports/revenue${periodoDoMes()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalRevenue');
    expect(response.body).toHaveProperty('completedAppointments');
    const revenue = response.body as {
      totalRevenue: number;
      completedAppointments: number;
    };
    // Receita = preço do serviço concluído (50) + cobrança por cancelamento tardio (50) = 100
    expect(revenue.totalRevenue).toBeGreaterThanOrEqual(100);
    expect(revenue.completedAppointments).toBeGreaterThanOrEqual(1);
  });
});
