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

  it('cria cliente sem sobrenome (sobrenome não é mais obrigatório)', async () => {
    const semSobrenome: CreateClientData = {
      name: 'Carlos',
      cellPhone: '11988887777',
    };
    clientRepoMock.createClient.mockResolvedValue({
      id: 2,
      ...semSobrenome,
    });

    const result = await useCase.execute(semSobrenome);

    expect(clientRepoMock.createClient).toHaveBeenCalledWith(semSobrenome);
    expect(clientRepoMock.createClient.mock.calls[0][0]).not.toHaveProperty(
      'lastName',
    );
    expect(result).toMatchObject({ id: 2, name: 'Carlos' });
  });

  it('normaliza celular mascarado para apenas dígitos antes de gravar', async () => {
    const mascarado: CreateClientData = {
      ...baseData,
      cellPhone: '(11) 98888-7777',
    };
    clientRepoMock.createClient.mockResolvedValue({ id: 3, ...baseData });

    await useCase.execute(mascarado);

    expect(clientRepoMock.createClient).toHaveBeenCalledWith({
      ...baseData,
      cellPhone: '11988887777',
    });
  });

  it('mantém celular já em dígitos crus inalterado', async () => {
    clientRepoMock.createClient.mockResolvedValue({ id: 4, ...baseData });

    await useCase.execute(baseData);

    expect(clientRepoMock.createClient).toHaveBeenCalledWith({
      ...baseData,
      cellPhone: '11988887777',
    });
  });

  it('rejeita celular que fica vazio após normalizar (RN não numerada — campo obrigatório)', async () => {
    const semDigitos: CreateClientData = {
      ...baseData,
      cellPhone: '()  -',
    };

    await expect(useCase.execute(semDigitos)).rejects.toThrow(HttpException);
    await expect(useCase.execute(semDigitos)).rejects.toThrow(
      'O celular do cliente é obrigatório.',
    );
    expect(clientRepoMock.createClient).not.toHaveBeenCalled();
  });
});
