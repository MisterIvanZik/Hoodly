import api from '../../lib/axios'
import type { Incident, CreateIncidentDto, IncidentStatus } from '../../types/incident.types'

export interface GetIncidentsParams {
  zoneId?: string
  signaledPar?: string
}

export const incidentsApi = {
  getAll: (params?: GetIncidentsParams) =>
    api.get<Incident[]>('/incidents', { params }),

  create: (data: CreateIncidentDto) =>
    api.post<Incident>('/incidents', data),

  updateStatut: (
    id: string,
    body: {
      statut: IncidentStatus
      assignedTo?: string | null
      resolutionComment?: string
    }
  ) => api.patch<Incident>(`/incidents/${id}`, body),

  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
