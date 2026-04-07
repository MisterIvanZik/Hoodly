export interface User {
  id: string
  auth0Id: string
  email: string
  name?: string
  picture?: string
  phone?: string
  role: 'user' | 'moderator' | 'admin'
  isActive: boolean
  zoneStatut: 'sans_zone' | 'en_attente_zone' | 'en_attente_adh' | 'actif'
  zoneId?: string
  createdAt?: Date
  updatedAt?: Date
}
