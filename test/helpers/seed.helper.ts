import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export type SeededData = {
  /**
   * Sufixo unico por execucao. Sem companyId para escopar a limpeza, os specs
   * marcam os registros que criam com ele para o cleanup encontra-los.
   */
  suffix: string;
  adminUserId: number;
  adminName: string;
  adminPassword: string;
  serviceId: number;
  serviceDurationMinutes: number;
  clientId: number;
};

const ADMIN_PASSWORD = 'senha123';

export async function seedTestDatabase(
  prisma: PrismaClient,
): Promise<SeededData> {
  const suffix = Date.now().toString().slice(-8);

  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 4);
  const admin = await prisma.user.create({
    data: {
      name: `admin-teste-${suffix}`,
      email: `admin-teste-${suffix}@barbearia.com`,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const service = await prisma.service.create({
    data: {
      name: `Corte de Teste ${suffix}`,
      price: 50,
      durationMinutes: 30,
    },
  });

  const client = await prisma.client.create({
    data: {
      name: 'Cliente',
      lastName: `Teste ${suffix}`,
      cellPhone: '11999990000',
    },
  });

  return {
    suffix,
    adminUserId: admin.id,
    adminName: admin.name,
    adminPassword: ADMIN_PASSWORD,
    serviceId: service.id,
    serviceDurationMinutes: service.durationMinutes,
    clientId: client.id,
  };
}

export async function cleanupTestDatabase(
  prisma: PrismaClient,
  seeded: SeededData,
): Promise<void> {
  await prisma.appointment.deleteMany({
    where: { professionalId: seeded.adminUserId },
  });
  await prisma.observation.deleteMany({
    where: { client: { lastName: { contains: seeded.suffix } } },
  });
  await prisma.loginAttempt.deleteMany({
    where: { identifier: { contains: seeded.suffix } },
  });
  await prisma.client.deleteMany({
    where: { lastName: { contains: seeded.suffix } },
  });
  await prisma.service.deleteMany({
    where: { name: { contains: seeded.suffix } },
  });
  await prisma.user.deleteMany({
    where: { name: { contains: seeded.suffix } },
  });
}
