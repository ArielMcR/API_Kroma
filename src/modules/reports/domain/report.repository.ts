export type ReportPeriod = {
  from: Date;
  to: Date;
};

export type AttendanceReport = {
  period: { from: string; to: string };
  totalAppointments: number;
  completed: number;
  cancelled: number;
  byDayOfWeek: Record<string, number>;
};

export type ServiceRankingItem = {
  serviceId: number;
  name: string;
  count: number;
  totalRevenue: number;
};

export type ServicesReport = {
  period: { from: string; to: string };
  ranking: ServiceRankingItem[];
};

export type RevenueReport = {
  period: { from: string; to: string };
  totalRevenue: number;
  completedAppointments: number;
  averageTicket: number;
  lostRevenueByCancellation: number;
};

export type AppointmentDetailService = {
  name: string;
  /** Preco congelado na marcacao, nao o do cadastro atual. */
  unitPrice: number;
  durationMinutes: number;
};

export type AppointmentDetailItem = {
  id: number;
  /** `YYYY-MM-DD` em dia local. */
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  /** Soma das duracoes congeladas dos itens. */
  durationMinutes: number;
  /** Soma dos precos congelados dos itens. */
  total: number;
  services: AppointmentDetailService[];
};

/**
 * Lista crua do periodo, com TODOS os status — a tela filtra por status do
 * lado dela. Devolver so os concluidos aqui obrigaria a uma chamada por chip.
 */
export type AppointmentsDetailReport = {
  period: { from: string; to: string };
  appointments: AppointmentDetailItem[];
};

export type DashboardReport = {
  today: { appointments: number; revenue: number };
  week: { appointments: number; revenue: number };
  month: { appointments: number; revenue: number };
};

export type OperationMetric = {
  count: number;
  avgDuration: number;
  successRate: number;
};

export type MetricsReport = {
  period: { from: string; to: string };
  operations: Record<string, OperationMetric>;
  totalErrors: number;
  conflictsBlocked: number;
};

export interface ReportRepository {
  getAttendanceReport(period: ReportPeriod): Promise<AttendanceReport>;
  getServicesReport(period: ReportPeriod): Promise<ServicesReport>;
  getRevenueReport(period: ReportPeriod): Promise<RevenueReport>;
  getAppointmentsDetail(
    period: ReportPeriod,
  ): Promise<AppointmentsDetailReport>;
  getDashboard(): Promise<DashboardReport>;
  getMetrics(period: ReportPeriod): Promise<MetricsReport>;
}
