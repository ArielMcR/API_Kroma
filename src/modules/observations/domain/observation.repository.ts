import { Observation, TipoObservacao } from './observation.entity';

export type CreateObservationData = {
  clientId: number;
  content: string;
  type?: TipoObservacao;
};

export type UpdateObservationData = Partial<
  Pick<CreateObservationData, 'content' | 'type'>
>;

export interface ObservationRepository {
  createObservation(data: CreateObservationData): Promise<Observation>;
  updateObservation(
    id: number,
    data: UpdateObservationData,
  ): Promise<Observation>;
  deleteObservation(id: number): Promise<void>;
  getObservationById(id: number): Promise<Observation | null>;
  getObservationsByClientId(clientId: number): Promise<Observation[]>;
}
