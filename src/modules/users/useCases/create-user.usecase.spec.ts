import { HttpException } from '@nestjs/common';
import { BcryptService } from 'src/modules/bcrypt/bcrypt.service';
import type { UserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { CreateUserUseCase } from './create-user.usecase';
import type { CreateUserDTO } from '../presentation/dtos/create-user.dto';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepoMock: jest.Mocked<UserRepository>;
  let bcryptServiceMock: jest.Mocked<
    Pick<BcryptService, 'comparePassword' | 'hashPassword'>
  >;

  const admin = { id: 1, name: 'Admin', role: 'ADMIN' } as unknown as User;
  const supervisor = {
    id: 2,
    name: 'Supervisor',
    role: 'SUPERVISOR',
  } as unknown as User;

  const baseData: CreateUserDTO = {
    name: 'Novo Usuário',
    email: 'novo@barbearia.com',
    passwordHash: 'senha-crua',
    role: 'BARBER',
  } as CreateUserDTO;

  beforeEach(() => {
    userRepoMock = {
      createUser: jest.fn().mockResolvedValue({ id: 10 }),
      findByEmail: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserByName: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    bcryptServiceMock = {
      comparePassword: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('senha-hasheada'),
    };

    useCase = new CreateUserUseCase(
      userRepoMock as unknown as UserRepository,
      bcryptServiceMock as unknown as BcryptService,
    );
  });

  it('SUPERVISOR cadastrando BARBER passa (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockResolvedValue(supervisor);

    await useCase.execute({
      ...baseData,
      userId: supervisor.id,
    } as CreateUserDTO);

    expect(userRepoMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'BARBER' }),
    );
  });

  it('SUPERVISOR cadastrando ADMIN é rejeitado com 403 (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockResolvedValue(supervisor);

    await expect(
      useCase.execute({
        ...baseData,
        role: 'ADMIN',
        userId: supervisor.id,
      } as CreateUserDTO),
    ).rejects.toMatchObject({ status: 403 });
    expect(userRepoMock.createUser).not.toHaveBeenCalled();
  });

  it('SUPERVISOR cadastrando outro SUPERVISOR é rejeitado com 403 (RF06/RF23)', async () => {
    userRepoMock.getUserById.mockResolvedValue(supervisor);

    await expect(
      useCase.execute({
        ...baseData,
        role: 'SUPERVISOR',
        userId: supervisor.id,
      } as CreateUserDTO),
    ).rejects.toThrow(HttpException);
    expect(userRepoMock.createUser).not.toHaveBeenCalled();
  });

  it('ADMIN cadastrando ADMIN passa', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    await useCase.execute({
      ...baseData,
      role: 'ADMIN',
      userId: admin.id,
    } as CreateUserDTO);

    expect(userRepoMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
    );
  });

  it('a senha é hasheada antes de chegar ao repositório', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    await useCase.execute({
      ...baseData,
      userId: admin.id,
    } as CreateUserDTO);

    expect(bcryptServiceMock.hashPassword).toHaveBeenCalledWith('senha-crua');
    expect(userRepoMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'senha-hasheada' }),
    );
  });

  it('o criador vem só do userId injetado pelo JWT, nunca de um campo do body (RF06)', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    await useCase.execute({
      ...baseData,
      userId: admin.id,
    } as CreateUserDTO);

    expect(userRepoMock.getUserById).toHaveBeenCalledWith(admin.id);
    expect(userRepoMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ creatorUserId: admin.id }),
    );
  });

  it('um `creatorUserId` enviado pelo cliente no body é ignorado — o criador é sempre o userId do JWT (escalonamento de privilégio)', async () => {
    userRepoMock.getUserById.mockImplementation((id: number) =>
      Promise.resolve(id === supervisor.id ? supervisor : admin),
    );

    // Um SUPERVISOR tenta se passar por um ADMIN mandando o id dele no body.
    await expect(
      useCase.execute({
        ...baseData,
        role: 'ADMIN',
        userId: supervisor.id,
        creatorUserId: admin.id,
      } as unknown as CreateUserDTO),
    ).rejects.toMatchObject({ status: 403 });
    expect(userRepoMock.getUserById).toHaveBeenCalledWith(supervisor.id);
    expect(userRepoMock.createUser).not.toHaveBeenCalled();
  });

  it('sem userId no body (criador não identificado) lança 400', async () => {
    await expect(
      useCase.execute({ ...baseData } as CreateUserDTO),
    ).rejects.toMatchObject({ status: 400 });
    expect(userRepoMock.getUserById).not.toHaveBeenCalled();
  });
});
