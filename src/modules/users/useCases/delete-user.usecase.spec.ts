import { HttpException } from '@nestjs/common';
import type { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { DeleteUserUseCase } from './delete-user.useCase';

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let userRepoMock: jest.Mocked<UserRepository>;

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
  const outroSupervisor = {
    id: 5,
    name: 'Outro Supervisor',
    role: 'SUPERVISOR',
  } as unknown as User;
  const barber = { id: 3, name: 'Barbeiro', role: 'BARBER' } as unknown as User;

  beforeEach(() => {
    userRepoMock = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserByName: jest.fn(),
      countActiveAdmins: jest.fn().mockResolvedValue(2),
    };

    useCase = new DeleteUserUseCase(userRepoMock);
  });

  it('SUPERVISOR removendo ADMIN é rejeitado com 403 (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : admin),
    );

    await expect(
      useCase.execute(admin.id, supervisor.id),
    ).rejects.toMatchObject({ status: 403 });
    expect(userRepoMock.deleteUser).not.toHaveBeenCalled();
  });

  it('SUPERVISOR removendo outro SUPERVISOR é rejeitado com 403 (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : outroSupervisor),
    );

    await expect(
      useCase.execute(outroSupervisor.id, supervisor.id),
    ).rejects.toMatchObject({ status: 403 });
    expect(userRepoMock.deleteUser).not.toHaveBeenCalled();
  });

  it('SUPERVISOR removendo BARBER passa', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : barber),
    );

    await useCase.execute(barber.id, supervisor.id);

    expect(userRepoMock.deleteUser).toHaveBeenCalledWith(barber.id);
  });

  it('ADMIN removendo qualquer papel passa', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === admin.id ? admin : supervisor),
    );

    await useCase.execute(supervisor.id, admin.id);

    expect(userRepoMock.deleteUser).toHaveBeenCalledWith(supervisor.id);
  });

  it('rejeita auto-remoção (id === currentUserId)', async () => {
    await expect(useCase.execute(admin.id, admin.id)).rejects.toMatchObject({
      status: 403,
    });
    expect(userRepoMock.getUserById).not.toHaveBeenCalled();
    expect(userRepoMock.deleteUser).not.toHaveBeenCalled();
  });

  it('rejeita remover o último ADMIN ativo', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === outroAdmin.id ? outroAdmin : admin),
    );
    userRepoMock.countActiveAdmins.mockResolvedValue(1);

    await expect(
      useCase.execute(outroAdmin.id, admin.id),
    ).rejects.toMatchObject({ status: 403 });
    expect(userRepoMock.deleteUser).not.toHaveBeenCalled();
  });

  it('permite remover um ADMIN quando há outros ADMINs ativos', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === outroAdmin.id ? outroAdmin : admin),
    );
    userRepoMock.countActiveAdmins.mockResolvedValue(2);

    await useCase.execute(outroAdmin.id, admin.id);

    expect(userRepoMock.deleteUser).toHaveBeenCalledWith(outroAdmin.id);
  });

  it('lança HttpException ao rejeitar (formato normalizado pelo filtro global)', async () => {
    await expect(useCase.execute(admin.id, admin.id)).rejects.toThrow(
      HttpException,
    );
  });
});
