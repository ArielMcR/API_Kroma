import { HttpException, HttpStatus } from '@nestjs/common';

export class AppointmentScheduleValidator {
  private static readonly ALLOWED_DAYS = [1, 2, 3, 4, 5, 6]; // segunda a sábado
  private static readonly MORNING = { start: '08:00', end: '12:00' };
  private static readonly AFTERNOON = { start: '13:15', end: '19:30' };
  private static readonly MAX_ADVANCE_DAYS = 7;

  /**
   * Converte a data do agendamento (string "YYYY-MM-DD" vinda da API ou Date)
   * para um Date em horário local, evitando que `new Date("YYYY-MM-DD")`
   * (interpretado como UTC) desloque o dia da semana em fusos negativos.
   */
  static parseAppointmentDate(value: Date | string): Date {
    if (typeof value === 'string') {
      const [year, month, day] = value.slice(0, 10).split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  static validate(
    appointmentDate: Date,
    startTime: string,
    endTime: string,
  ): void {
    const dayOfWeek = appointmentDate.getDay();

    if (!this.ALLOWED_DAYS.includes(dayOfWeek)) {
      throw new HttpException(
        'Agendamentos só são permitidos de segunda a sábado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const inMorning =
      startTime >= this.MORNING.start && endTime <= this.MORNING.end;
    const inAfternoon =
      startTime >= this.AFTERNOON.start && endTime <= this.AFTERNOON.end;

    if (!inMorning && !inAfternoon) {
      throw new HttpException(
        'Horário fora do período permitido (08:00-12:00 ou 13:15-19:30)',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  static validateAdvance(appointmentDate: Date): void {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + this.MAX_ADVANCE_DAYS);

    if (appointmentDate > maxDate) {
      throw new HttpException(
        'Agendamentos limitados a no máximo uma semana de antecedência',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (appointmentDate < new Date(now.toDateString())) {
      throw new HttpException(
        'Não é possível agendar em data passada',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
