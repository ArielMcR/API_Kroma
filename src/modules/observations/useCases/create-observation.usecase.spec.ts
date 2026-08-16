import type {
  CreateObservationData,
  ObservationRepository,
} from '../domain/observation.repository';
import { CreateObservationUseCase } from './create-observation.usecase';

describe('CreateObservationUseCase', () => {
  let useCase: CreateObservationUseCase;
  let observationRepoMock: jest.Mocked<ObservationRepository>;

  beforeEach(() => {
    observationRepoMock = {
      createObservation: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      updateObservation: jest.fn(),
      deleteObservation: jest.fn(),
      getObservationById: jest.fn(),
      getObservationsByClientId: jest.fn(),
    };
    useCase = new CreateObservationUseCase(observationRepoMock);
  });

  it('cria observação vinculada a um cliente existente', async () => {
    const data: CreateObservationData = {
      clientId: 1,
      content: 'Prefere corte na máquina 2',
      type: 'PREFERENCIA',
    };

    const result = await useCase.execute(data);

    expect(observationRepoMock.createObservation).toHaveBeenCalledWith(data);
    expect(result).toMatchObject({ id: 1, clientId: 1 });
  });

  it('propaga erro do repositório quando o cliente não existe (FK inválida)', async () => {
    observationRepoMock.createObservation.mockRejectedValue(
      new Error('Referência inválida (FK)'),
    );

    await expect(
      useCase.execute({ clientId: 999, content: 'x' }),
    ).rejects.toThrow('Referência inválida (FK)');
  });

  it.each<CreateObservationData['type']>([
    'CANCELAMENTO',
    'PREFERENCIA',
    'OUTRO',
  ])('aceita o tipo de observação "%s"', async (tipo) => {
    const data: CreateObservationData = {
      clientId: 1,
      content: 'Observação',
      type: tipo,
    };

    await useCase.execute(data);

    expect(observationRepoMock.createObservation).toHaveBeenCalledWith(
      expect.objectContaining({ type: tipo }),
    );
  });
});
