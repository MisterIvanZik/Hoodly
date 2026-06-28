export type IncidentStatus = 'signale' | 'en_cours' | 'resolu' | 'ferme';
export type IncidentPriority = 'basse' | 'normale' | 'haute' | 'urgente';
export type IncidentContext = 'quartier' | 'service' | 'evenement';

export interface Incident {
  _id: string;
  type: string;
  description: string;
  photoUrl?: string;
  statut: IncidentStatus;
  priorite: IncidentPriority;
  contexte: IncidentContext;
  serviceId?: any;
  eventId?: any;
  signaledPar?: string;
  zoneId?: string;
  assignedTo?: string;
  resolutionComment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIncidentDto {
  type: string;
  description: string;
  photoUrl?: string;
  statut?: IncidentStatus;
  priorite?: IncidentPriority;
  contexte?: IncidentContext;
  serviceId?: string;
  eventId?: string;
  zoneId?: string;
  signaledPar?: string;
}
