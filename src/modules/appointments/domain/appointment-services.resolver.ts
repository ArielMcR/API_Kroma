import { HttpException, HttpStatus } from '@nestjs/common';
import type { ServicesRepository } from 'src/modules/services/domain/services.repository';
import type { AppointmentServiceInput } from './appointment.repository';

/**
 * Traduz `serviceIds` crus (o que a API recebe) nos itens que o repositorio
 * persiste, com preco e duracao CONGELADOS na marcacao. Vive no dominio porque
 * criar e remarcar precisam exatamente da mesma regra — trocar o servico de um
 * agendamento tem que congelar o preco igual a marcacao original.
 */
export class AppointmentServicesResolver {
  /**
   * Busca cada servico e congela preco e duracao. Rejeita lista vazia e ids
   * inexistentes antes de qualquer escrita — um agendamento sem servico nao
   * tem duracao nem valor, entao nao pode existir.
   */
  static async resolve(
    servicesRepository: ServicesRepository,
    serviceIds: number[],
  ): Promise<AppointmentServiceInput[]> {
    if (!serviceIds?.length) {
      throw new HttpException(
        'Informe ao menos um serviço para o agendamento',
        HttpStatus.BAD_REQUEST,
      );
    }

    const services: AppointmentServiceInput[] = [];

    for (const [position, serviceId] of serviceIds.entries()) {
      const service = await servicesRepository.getServiceById(serviceId);
      if (!service) {
        throw new HttpException(
          `Serviço ${serviceId} não encontrado`,
          HttpStatus.BAD_REQUEST,
        );
      }

      services.push({
        serviceId,
        unitPrice: service.price,
        durationMinutes: service.durationMinutes,
        position,
      });
    }

    return services;
  }

  /**
   * A duracao do atendimento e a SOMA das duracoes dos servicos: corte de
   * 30min + barba de 20min ocupa 50min da agenda, nao 30.
   */
  static totalDuration(services: AppointmentServiceInput[]): number {
    return services.reduce((total, s) => total + s.durationMinutes, 0);
  }

  static calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }
}
