import { HttpException } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import { CancelAppointmentUseCase } from './cancel-appointment.usecase';
import type { Appointment } from '../domain/appointment.entity';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let appointmentRepoMock: jest.Mocked<AppointmentRepository>;
  let servicesRepoMock: jest.Mocked<ServicesRepository>;

  const buildAppointment = (hoursFromNow: number): Appointment => {
    const target = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
    const startTime = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
    return {
      id: 1,
      clientId: 1,
      services: [
        {
          id: 1,
          appointmentId: 1,
          serviceId: 1,
          unitPrice: 50,
          durationMinutes: 30,
          position: 0,
        },
      ],
      professionalId: 1,
      appointmentDate: target,
      startTime,
      endTime: startTime,
      status: 'SCHEDULED',
      durationMinutes: 30,
      cancelledLate: false,
      chargeRegistered: false,
    };
  };

  beforeEach(() => {
    appointmentRepoMock = {
      createAppointment: jest.fn(),
      updateAppointment: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      deleteAppointment: jest.fn(),
      getAppointmentById: jest.fn(),
      getAllAppointments: jest.fn(),
      findConflicting: jest.fn(),
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
    useCase = new CancelAppointmentUseCase(appointmentRepoMock);
  });

  it('cancelamento com mais de 1h de antecedência: não registra cobrança (RN05)', async () => {
    appointmentRepoMock.getAppointmentById.mockResolvedValue(
      buildAppointment(2),
    );

    const result = await useCase.execute(1);

    expect(servicesRepoMock.getServiceById).not.toHaveBeenCalled();
    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 'CANCELLED',
        cancelledLate: false,
        chargeRegistered: false,
        chargeAmount: null,
      }),
    );
    expect(result).toHaveProperty('id', 1);
  });

  it('cancelamento com menos de 1h de antecedência: registra cobrança (RF10)', async () => {
    appointmentRepoMock.getAppointmentById.mockResolvedValue(
      buildAppointment(0.5),
    );

    await useCase.execute(1);

    // A multa vem dos preços CONGELADOS no agendamento, sem consultar o
    // cadastro do serviço — reajuste posterior não muda cobrança passada.
    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 'CANCELLED',
        cancelledLate: true,
        chargeRegistered: true,
        chargeAmount: 50,
      }),
    );
  });

  it('cancelamento de agendamento inexistente lança HTTP 404', async () => {
    appointmentRepoMock.getAppointmentById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(HttpException);
    await expect(useCase.execute(999)).rejects.toMatchObject({ status: 404 });
  });
});
