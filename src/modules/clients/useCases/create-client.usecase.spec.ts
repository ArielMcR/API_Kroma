import { HttpException } from '@nestjs/common';
import type {
  ClientRepository,
  CreateClientData,
} from '../domain/client.repository';
import { CreateClientUseCase } from './create-client.usecase';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientRepoMock: jest.Mocked<ClientRepository>;

  const baseData: CreateClientData = {
    name: 'Carlos',
    lastName: 'Almeida',
    cellPhone: '11988887777',
  };

  beforeEach(() => {
    clientRepoMock = {
      createClient: jest.fn(),
      updateClient: jest.fn(),
      deleteClient: jest.fn(),
      getClientById: jest.fn(),
      getAllClients: jest.fn(),
      findByName: jest.fn(),
    };
    useCase = new CreateClientUseCase(clientRepoMock);
  });

  it('cria cliente com dados válidos', async () => {
    clientRepoMock.createClient.mockResolvedValue({ id: 1, ...baseData });

    const result = await useCase.execute(baseData);

    expect(clientRepoMock.createClient).toHaveBeenCalledWith(baseData);
    expect(result).toMatchObject({ id: 1, name: 'Carlos' });
  });

  it('lança erro quando o repositório não retorna o cliente criado', async () => {
    clientRepoMock.createClient.mockResolvedValue(null);

    await expect(useCase.execute(baseData)).rejects.toThrow(HttpException);
    clientRepoMock.createClient.mockResolvedValue(null);
    await expect(useCase.execute(baseData)).rejects.toThrow(
      'Error creating client',
    );
  });

  it('propaga falhas do repositório (ex: violação de FK na criação)', async () => {
    clientRepoMock.createClient.mockRejectedValue(
      new HttpException('Referência inválida (FK)', 400),
    );

    await expect(useCase.execute(baseData)).rejects.toThrow(
      'Referência inválida (FK)',
    );
  });
});
