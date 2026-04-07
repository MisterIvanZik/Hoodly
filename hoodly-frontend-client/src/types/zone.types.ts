export interface Zone {
  id: string
  nom: string
  ville: string
  polygone?: {
    type: string
    coordinates: number[][][]
  }
  statut: 'active' | 'inactive'
  membresCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ZoneMembership {
  id: string
  userId: string
  zoneId: string
  justificatifUrl: string
  pieceIdentiteUrl: string
  statut: 'en_attente' | 'accepte' | 'refuse'
  commentaireAdmin?: string
}

export interface ZoneRequest {
  id: string
  userId: string
  nomQuartier: string
  ville: string
  codePostal: string
  description: string
  statut: 'en_attente' | 'accepte' | 'refuse'
  commentaireAdmin?: string
}
