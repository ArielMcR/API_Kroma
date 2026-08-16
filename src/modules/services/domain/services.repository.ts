import { ServiceData } from './data/service.data';
import { UpdateServiceData } from './data/update-service.data';
import { Service } from './services.entity';

export interface ServicesRepository {
  createService(serviceData: ServiceData): Promise<any>;
  updateService(id: number, data: UpdateServiceData): Promise<any>;
  deleteService(id: number): Promise<void>;
  getServiceById(id: number): Promise<Service | null>;
  getAllServices(): Promise<Service[]>;
  /** Busca por nome aproximado, usado pelo assistente (Sprint 3). */
  findByName(name: string): Promise<Service | null>;
}
