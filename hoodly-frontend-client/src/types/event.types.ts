export interface EventLieu {
  adresse?: string
  ville?: string
  codePostal?: string
  latitude?: number
  longitude?: number
}

export type EventStatus = 'planifié' | 'en_cours' | 'terminé' | 'annulé'

export interface EventParticipant {
  id: string
  name: string
  picture?: string
}

export interface Event {
  id: string
  createurId: string
  titre: string
  description?: string
  categorie: string
  date: string
  lieu: EventLieu
  capacite: number
  statut: EventStatus
  interesses: string[]
  participants: string[]
  participantsFull?: EventParticipant[]
  payant: boolean
  pointsCout?: number
  pointsCreateur: number
  pointsParticipant: number
  participantsPresents: string[]
  photoUrl?: string
  conversationId?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateEventDto {
  titre: string
  description?: string
  categorie: string
  date: string
  lieu: EventLieu
  capacite: number
  payant?: boolean
  pointsCout?: number
  pointsCreateur?: number
  pointsParticipant?: number
  photoUrl?: string
}

export interface PaginatedEvents {
  events: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}
