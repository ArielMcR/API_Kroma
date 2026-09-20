import { PrismaService } from 'src/modules/prisma/prisma.service';
import { PrismaClientsRepository } from './prisma-clients';

/**
 * A projeção explícita nos métodos de escrita é a proteção real contra campo
 * extra chegando ao Prisma (o ValidationPipe global não tem `whitelist`, e o
 * InjectUserBodyInterceptor injeta `userId` em todo body autenticado). Estes
 * testes cobrem isso na camada onde a proteção de fato acontece.
 */
describe('PrismaClientsRepository', () => {
  const criarMock = () => {
    const create = jest.fn().mockResolvedValue({ id: 1 });
    const update = jest.fn().mockResolvedValue({ id: 1 });
    const prisma = { client: { create, update } } as unknown as PrismaService;
    const repository = new PrismaClientsRepository(prisma);
    return { repository, create, update };
  };

  it('createClient projeta apenas name/lastName/cellPhone, descartando campo extra (ex.: email)', async () => {
    const { repository, create } = criarMock();

    await repository.createClient({
      name: 'Carlos',
      lastName: 'Almeida',
      cellPhone: '11988887777',
      // @ts-expect-error campo não declarado no tipo, simula payload malicioso/indevido
      email: 'carlos@example.com',
      userId: 5,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Carlos',
        lastName: 'Almeida',
        cellPhone: '11988887777',
      },
    });
  });

  it('createClient aceita cliente sem lastName', async () => {
    const { repository, create } = criarMock();

    await repository.createClient({
      name: 'Carlos',
      cellPhone: '11988887777',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Carlos',
        lastName: undefined,
        cellPhone: '11988887777',
      },
    });
  });

  it('updateClient com apenas cellPhone não envia name/lastName ao Prisma (não apaga o que não veio)', async () => {
    const { repository, update } = criarMock();

    await repository.updateClient({ cellPhone: '11999998888' }, 10);

    expect(update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { cellPhone: '11999998888' },
    });
  });

  it('updateClient descarta userId e campo extra não declarado', async () => {
    const { repository, update } = criarMock();

    await repository.updateClient(
      {
        name: 'Novo Nome',
        userId: 5,
        // @ts-expect-error campo não declarado no tipo
        email: 'novo@example.com',
      },
      10,
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { name: 'Novo Nome' },
    });
  });
});
