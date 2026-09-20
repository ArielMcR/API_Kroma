import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import type { UpdateUserData, UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { UpdateUserUseCase } from './update-user.usecase';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let userRepoMock: jest.Mocked<UserRepository>;
  let bcryptServiceMock: jest.Mocked<
    Pick<BcryptService, 'comparePassword' | 'hashPassword'>
  >;

  const admin = { id: 1, name: 'Admin', role: 'ADMIN' } as unknown as User;
  const outroAdmin = {
    id: 4,
    name: 'Outro Admin',
    role: 'ADMIN',
  } as unknown as User;
  const supervisor = {
    id: 2,
    name: 'Supervisor',
    role: 'SUPERVISOR',
  } as unknown as User;
  const barber = { id: 3, name: 'Barbeiro', role: 'BARBER' } as unknown as User;

  beforeEach(() => {
    userRepoMock = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn().mockResolvedValue({ id: 3 }),
      deleteUser: jest.fn(),
      getUserByName: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    bcryptServiceMock = {
      comparePassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('senha-hasheada'),
    };

    useCase = new UpdateUserUseCase(
      userRepoMock as unknown as UserRepository,
      bcryptServiceMock as unknown as BcryptService,
    );
  });

  it('passwordHash presente chega hasheado no repositório', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    const data: UpdateUserData = {
      passwordHash: 'senha-crua',
      userId: admin.id,
    };
    await useCase.execute(3, data);

    expect(bcryptServiceMock.hashPassword).toHaveBeenCalledWith('senha-crua');
    expect(userRepoMock.updateUser).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ passwordHash: 'senha-hasheada' }),
    );
  });

  it('SUPERVISOR editando um ADMIN é rejeitado com 403 (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : admin),
    );

    const data: UpdateUserData = { name: 'Novo Nome', userId: supervisor.id };

    await expect(useCase.execute(admin.id, data)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('SUPERVISOR editando um BARBER passa', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : barber),
    );

    const data: UpdateUserData = { name: 'Novo Nome', userId: supervisor.id };

    await useCase.execute(barber.id, data);

    expect(userRepoMock.updateUser).toHaveBeenCalledWith(barber.id, data);
  });

  it('SUPERVISOR tentando promover um BARBER a ADMIN é rejeitado com 403', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : barber),
    );

    const data: UpdateUserData = { role: 'ADMIN', userId: supervisor.id };

    await expect(useCase.execute(barber.id, data)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('ADMIN editando outro ADMIN passa sem restrição', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    const data: UpdateUserData = { name: 'Novo Nome', userId: admin.id };

    await useCase.execute(admin.id, data);

    expect(userRepoMock.updateUser).toHaveBeenCalledWith(admin.id, data);
  });

  it('desativar o último ADMIN ativo é rejeitado com 403', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === outroAdmin.id ? outroAdmin : admin),
    );
    userRepoMock.countActiveAdmins.mockResolvedValue(1);

    const data: UpdateUserData = { active: false, userId: outroAdmin.id };

    await expect(useCase.execute(admin.id, data)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('rebaixar o último ADMIN ativo para BARBER é rejeitado com 403', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === outroAdmin.id ? outroAdmin : admin),
    );
    userRepoMock.countActiveAdmins.mockResolvedValue(1);

    const data: UpdateUserData = { role: 'BARBER', userId: outroAdmin.id };

    await expect(useCase.execute(admin.id, data)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('ADMIN se rebaixando é rejeitado com 403 mesmo havendo outros ADMINs ativos (auto-rebaixamento)', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);
    userRepoMock.countActiveAdmins.mockResolvedValue(2);

    const data: UpdateUserData = { role: 'BARBER', userId: admin.id };

    await expect(useCase.execute(admin.id, data)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.updateUser).not.toHaveBeenCalled();
  });

  it('ADMIN rebaixando outro ADMIN passa quando há mais de um ADMIN ativo', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === outroAdmin.id ? outroAdmin : admin),
    );
    userRepoMock.countActiveAdmins.mockResolvedValue(2);

    const data: UpdateUserData = { role: 'BARBER', userId: admin.id };

    await useCase.execute(outroAdmin.id, data);

    expect(userRepoMock.updateUser).toHaveBeenCalledWith(outroAdmin.id, data);
  });

  it('desativar um BARBER passa — a guarda de último ADMIN não vaza para outros papéis', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === admin.id ? admin : barber),
    );

    const data: UpdateUserData = { active: false, userId: admin.id };

    await useCase.execute(barber.id, data);

    expect(userRepoMock.updateUser).toHaveBeenCalledWith(barber.id, data);
  });
});
