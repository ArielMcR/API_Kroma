import { HttpException } from '@nestjs/common';
import type {
  AppointmentRepository,
  CreateAppointmentData,
} from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import { CreateAppointmentUseCase } from './create-appointment.usecase';

const SEXTA_DENTRO_DA_SEMANA = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const diasParaSexta = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diasParaSexta);
  return date;
};

// Próximo dia (a partir de amanhã, dentro do limite de 7 dias) que não seja sexta nem sábado
const DIA_NAO_PERMITIDO_DENTRO_DO_LIMITE = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 5 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let appointmentRepoMock: jest.Mocked<AppointmentRepository>;
  let servicesRepoMock: jest.Mocked<ServicesRepository>;

  const baseData = (): CreateAppointmentData => ({
    clientId: 1,
    serviceIds: [1],
    professionalId: 1,
    appointmentDate: SEXTA_DENTRO_DA_SEMANA(),
    startTime: '09:00',
    endTime: '',
    status: 'SCHEDULED',
  });

  beforeEach(() => {
    appointmentRepoMock = {
      createAppointment: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      updateAppointment: jest.fn(),
      deleteAppointment: jest.fn(),
      getAppointmentById: jest.fn(),
      getAllAppointments: jest.fn(),
      findConflicting: jest.fn().mockResolvedValue([]),
      getByDate: jest.fn().mockResolvedValue([]),
    };
    servicesRepoMock = {
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
      getServiceById: jest
        .fn()
        .mockResolvedValue({ id: 1, durationMinutes: 30, price: 50 } as any),
      getAllServices: jest.fn(),
      findByName: jest.fn(),
    };
    useCase = new CreateAppointmentUseCase(
      appointmentRepoMock,
      servicesRepoMock,
    );
  });

  it('cria um agendamento válido', async () => {
    const data = baseData();

    const result = await useCase.execute(data);

    expect(appointmentRepoMock.findConflicting).toHaveBeenCalled();
    expect(appointmentRepoMock.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: '09:00',
        endTime: '09:30',
        durationMinutes: 30,
      }),
    );
    expect(result).toHaveProperty('id');
  });

  it('rejeita agendamento em dia não permitido (RN01)', async () => {
    const data = baseData();
    data.appointmentDate = DIA_NAO_PERMITIDO_DENTRO_DO_LIMITE();

    await expect(useCase.execute(data)).rejects.toThrow(
      'Agendamentos só são permitidos às sextas e sábados',
    );
  });

  it('rejeita agendamento fora dos horários permitidos (RN02)', async () => {
    const data = baseData();
    data.startTime = '07:00';
    data.durationMinutes = 30;

    await expect(useCase.execute(data)).rejects.toThrow(
      'Horário fora do período permitido (08:00-12:00 ou 13:15-19:30)',
    );
  });

  it('rejeita agendamento com mais de 7 dias de antecedência (RN09)', async () => {
    const data = baseData();
    const distante = new Date();
    distante.setDate(distante.getDate() + 30);
    data.appointmentDate = distante;

    await expect(useCase.execute(data)).rejects.toThrow(
      'Agendamentos limitados a no máximo uma semana de antecedência',
    );
  });

  it('rejeita agendamento em data passada', async () => {
    const data = baseData();
    const passado = new Date();
    passado.setDate(passado.getDate() - 10);
    data.appointmentDate = passado;

    await expect(useCase.execute(data)).rejects.toThrow(
      'Não é possível agendar em data passada',
    );
  });

  it('rejeita agendamento conflitante (RF06, RN04)', async () => {
    appointmentRepoMock.findConflicting.mockResolvedValue([{ id: 99 } as any]);
    const data = baseData();

    await expect(useCase.execute(data)).rejects.toThrow(HttpException);
    await expect(useCase.execute(baseData())).rejects.toThrow(
      'Já existe um agendamento neste horário',
    );
  });

  it('aplica a duração padrão do serviço quando não informada (RN03)', async () => {
    servicesRepoMock.getServiceById.mockResolvedValue({
      id: 1,
      durationMinutes: 45,
      price: 50,
    } as any);
    const data = baseData();

    await useCase.execute(data);

    expect(servicesRepoMock.getServiceById).toHaveBeenCalledWith(1);
    expect(appointmentRepoMock.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: 45, endTime: '09:45' }),
    );
  });

  it('soma as durações de vários serviços e congela os preços', async () => {
    servicesRepoMock.getServiceById
      .mockResolvedValueOnce({
        id: 1,
        durationMinutes: 30,
        price: 40,
      } as any)
      .mockResolvedValueOnce({
        id: 2,
        durationMinutes: 20,
        price: 25,
      } as any);

    const data = baseData();
    data.serviceIds = [1, 2];

    await useCase.execute(data);

    expect(appointmentRepoMock.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        // 30 + 20 = 50min a partir das 09:00.
        durationMinutes: 50,
        endTime: '09:50',
        services: [
          { serviceId: 1, unitPrice: 40, durationMinutes: 30, position: 0 },
          { serviceId: 2, unitPrice: 25, durationMinutes: 20, position: 1 },
        ],
      }),
    );
  });

  it('recusa agendamento sem nenhum serviço', async () => {
    const data = baseData();
    data.serviceIds = [];

    await expect(useCase.execute(data)).rejects.toThrow(HttpException);
    expect(appointmentRepoMock.createAppointment).not.toHaveBeenCalled();
  });
});
