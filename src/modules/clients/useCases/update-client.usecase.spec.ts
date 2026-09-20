import type {
  ClientRepository,
  UpdateClientData,
} from '../domain/client.repository';
import { UpdateClientUseCase } from './update-client.usecase';

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase;
  let clientRepoMock: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    clientRepoMock = {
      createClient: jest.fn(),
      updateClient: jest.fn(),
      deleteClient: jest.fn(),
      getClientById: jest.fn(),
      getAllClients: jest.fn(),
      findByName: jest.fn(),
    };
    useCase = new UpdateClientUseCase(clientRepoMock);
  });

  it('repassa apenas os dados recebidos ao repositório', async () => {
    const data: UpdateClientData = { cellPhone: '11999998888' };
    clientRepoMock.updateClient.mockResolvedValue({ id: 1, ...data });

    const result = await useCase.execute(data, 1);

    expect(clientRepoMock.updateClient).toHaveBeenCalledWith(data, 1);
    expect(clientRepoMock.updateClient.mock.calls[0][0]).not.toHaveProperty(
      'name',
    );
    expect(clientRepoMock.updateClient.mock.calls[0][0]).not.toHaveProperty(
      'lastName',
    );
    expect(result).toMatchObject({ id: 1, cellPhone: '11999998888' });
  });

  it('propaga falhas do repositório', async () => {
    clientRepoMock.updateClient.mockRejectedValue(
      new Error('Cliente não encontrado'),
    );

    await expect(useCase.execute({ name: 'Novo Nome' }, 99)).rejects.toThrow(
      'Cliente não encontrado',
    );
  });

  it('normaliza celular mascarado para apenas dígitos antes de gravar', async () => {
    const data: UpdateClientData = { cellPhone: '(11) 98888-7777' };
    clientRepoMock.updateClient.mockResolvedValue({
      id: 1,
      cellPhone: '11988887777',
    });

    await useCase.execute(data, 1);

    expect(clientRepoMock.updateClient).toHaveBeenCalledWith(
      { cellPhone: '11988887777' },
      1,
    );
  });

  it('mantém celular já em dígitos crus inalterado', async () => {
    const data: UpdateClientData = { cellPhone: '11988887777' };
    clientRepoMock.updateClient.mockResolvedValue({ id: 1, ...data });

    await useCase.execute(data, 1);

    expect(clientRepoMock.updateClient).toHaveBeenCalledWith(data, 1);
  });

  it('não normaliza nem inclui cellPhone quando ele não veio no PATCH', async () => {
    const data: UpdateClientData = { name: 'Novo Nome' };
    clientRepoMock.updateClient.mockResolvedValue({ id: 1, ...data });

    await useCase.execute(data, 1);

    const payloadEnviado = clientRepoMock.updateClient.mock.calls[0][0];
    expect(payloadEnviado).not.toHaveProperty('cellPhone');
    expect(payloadEnviado).toEqual({ name: 'Novo Nome' });
  });
});
