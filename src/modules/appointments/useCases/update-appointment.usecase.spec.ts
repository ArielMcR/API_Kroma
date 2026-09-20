import { HttpException } from '@nestjs/common';
import type { AppointmentRepository } from '../domain/appointment.repository';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import type { UserRepository } from 'src/modules/users/domain/user.repository';
import type { User } from 'src/modules/users/domain/user.entity';
import { UpdateAppointmentUseCase } from './update-appointment.usecase';
import type { Appointment } from '../domain/appointment.entity';

describe('UpdateAppointmentUseCase', () => {
  let useCase: UpdateAppointmentUseCase;
  let appointmentRepoMock: jest.Mocked<AppointmentRepository>;
  let servicesRepoMock: jest.Mocked<ServicesRepository>;
  let userRepoMock: jest.Mocked<UserRepository>;

  const barberDono = {
    id: 1,
    name: 'Barbeiro Dono',
    role: 'BARBER',
  } as unknown as User;
  const outroBarber = {
    id: 9,
    name: 'Outro Barbeiro',
    role: 'BARBER',
  } as unknown as User;
  const admin = { id: 2, name: 'Admin', role: 'ADMIN' } as unknown as User;

  const currentAppointment: Appointment = {
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
    appointmentDate: new Date('2026-04-10T00:00:00'),
    startTime: '09:00',
    endTime: '09:30',
    status: 'SCHEDULED',
    durationMinutes: 30,
    cancelledLate: false,
    chargeRegistered: false,
  };

  beforeEach(() => {
    appointmentRepoMock = {
      createAppointment: jest.fn(),
      updateAppointment: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      deleteAppointment: jest.fn(),
      getAppointmentById: jest
        .fn()
        .mockResolvedValue({ ...currentAppointment }),
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
    userRepoMock = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      getUserById: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserByName: jest.fn(),
      countActiveAdmins: jest.fn(),
    };
    useCase = new UpdateAppointmentUseCase(
      appointmentRepoMock,
      servicesRepoMock,
      userRepoMock,
    );
  });

  it('permite remarcar mantendo o mesmo agendamento (exclui a si mesmo da checagem de conflito)', async () => {
    const result = await useCase.execute(1, {
      startTime: '14:00',
      endTime: '14:30',
    });

    expect(appointmentRepoMock.findConflicting).toHaveBeenCalledWith(
      currentAppointment.professionalId,
      currentAppointment.appointmentDate,
      '14:00',
      '14:30',
      1,
    );
    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        startTime: '14:00',
        endTime: '14:30',
      }),
    );
    expect(result).toHaveProperty('id', 1);
  });

  it('rejeita remarcação para horário conflitante', async () => {
    appointmentRepoMock.findConflicting.mockResolvedValue([{ id: 2 } as any]);

    await expect(
      useCase.execute(1, { startTime: '14:00', endTime: '14:30' }),
    ).rejects.toThrow('Já existe um agendamento neste horário');
    await expect(
      useCase.execute(1, { startTime: '14:00', endTime: '14:30' }),
    ).rejects.toThrow(HttpException);
  });

  it('troca os serviços congelando preço e duração, e nunca repassa serviceIds ao repositório', async () => {
    servicesRepoMock.getServiceById
      .mockResolvedValueOnce({ id: 1, durationMinutes: 30, price: 40 } as any)
      .mockResolvedValueOnce({ id: 2, durationMinutes: 20, price: 25 } as any);

    await useCase.execute(1, { clientId: 2, serviceIds: [1, 2] });

    const [, payload] = appointmentRepoMock.updateAppointment.mock.calls[0];
    expect(payload).not.toHaveProperty('serviceIds');
    expect(payload).toMatchObject({
      clientId: 2,
      // 30 + 20 = 50min a partir das 09:00 (horário atual do agendamento).
      durationMinutes: 50,
      endTime: '09:50',
      services: [
        { serviceId: 1, unitPrice: 40, durationMinutes: 30, position: 0 },
        { serviceId: 2, unitPrice: 25, durationMinutes: 20, position: 1 },
      ],
    });
  });

  it('recalcula o endTime pela duração, ignorando o enviado pelo cliente', async () => {
    servicesRepoMock.getServiceById.mockResolvedValue({
      id: 1,
      durationMinutes: 60,
      price: 80,
    } as any);

    await useCase.execute(1, { serviceIds: [1], endTime: '09:30' });

    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ endTime: '10:00', durationMinutes: 60 }),
    );
  });

  it('rejeita troca de serviço que estoura o expediente (RN02)', async () => {
    appointmentRepoMock.getAppointmentById.mockResolvedValue({
      ...currentAppointment,
      startTime: '19:00',
      endTime: '19:30',
    });
    servicesRepoMock.getServiceById.mockResolvedValue({
      id: 1,
      durationMinutes: 90,
      price: 100,
    } as any);

    await expect(useCase.execute(1, { serviceIds: [1] })).rejects.toThrow(
      'Horário fora do período permitido (08:00-12:00 ou 13:15-19:30)',
    );
    expect(appointmentRepoMock.updateAppointment).not.toHaveBeenCalled();
  });

  it('recusa remarcação sem nenhum serviço', async () => {
    await expect(useCase.execute(1, { serviceIds: [] })).rejects.toThrow(
      HttpException,
    );
    expect(appointmentRepoMock.updateAppointment).not.toHaveBeenCalled();
  });

  it('lança HTTP 404 ao tentar atualizar agendamento inexistente', async () => {
    appointmentRepoMock.getAppointmentById.mockResolvedValue(null);

    await expect(
      useCase.execute(999, { startTime: '14:00' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('BARBER editando agendamento de outro profissional é rejeitado com 403 (RF09)', async () => {
    userRepoMock.getUserById.mockResolvedValue(outroBarber);

    await expect(
      useCase.execute(1, { startTime: '14:00', userId: outroBarber.id }),
    ).rejects.toMatchObject({ status: 403 });
    expect(appointmentRepoMock.updateAppointment).not.toHaveBeenCalled();
  });

  it('BARBER editando o próprio agendamento passa (RF09)', async () => {
    userRepoMock.getUserById.mockResolvedValue(barberDono);

    await useCase.execute(1, { startTime: '14:00', userId: barberDono.id });

    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalled();
  });

  it('ADMIN editando agendamento de outro profissional passa livre (RF09)', async () => {
    userRepoMock.getUserById.mockResolvedValue(admin);

    await useCase.execute(1, { startTime: '14:00', userId: admin.id });

    expect(appointmentRepoMock.updateAppointment).toHaveBeenCalled();
  });

  it('BARBER não move o agendamento para a agenda de outro profissional (RF07)', async () => {
    userRepoMock.getUserById.mockResolvedValue(barberDono);

    await useCase.execute(1, {
      startTime: '14:00',
      userId: barberDono.id,
      professionalId: outroBarber.id,
    });

    const [, payload] = appointmentRepoMock.updateAppointment.mock.calls[0];
    expect(payload.professionalId).toBe(currentAppointment.professionalId);
  });

  it('tentativa de mandar chargeAmount, chargeRegistered, cancelledLate ou status no PATCH não chega ao repositório', async () => {
    await useCase.execute(1, {
      chargeAmount: 999,
      chargeRegistered: true,
      cancelledLate: true,
      status: 'CANCELLED',
    } as any);

    const [, payload] = appointmentRepoMock.updateAppointment.mock.calls[0];
    expect(payload).not.toHaveProperty('chargeAmount');
    expect(payload).not.toHaveProperty('chargeRegistered');
    expect(payload).not.toHaveProperty('cancelledLate');
    expect(payload).not.toHaveProperty('status');
  });
});
