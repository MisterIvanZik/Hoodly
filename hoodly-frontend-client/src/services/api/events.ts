import api from '../../lib/axios'
import type { CreateEventDto, PaginatedEvents } from '../../types/event.types'

export const eventsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; categorie?: string; statut?: string }) =>
    api.get<PaginatedEvents>('/events', { params }),

  create: (data: CreateEventDto) =>
    api.post('/events', data),

  toggleInteret: (id: string) =>
    api.post<{ interested: boolean }>(`/events/${id}/interet`),

  participer: (id: string) =>
    api.post<{ participating: boolean }>(`/events/${id}/participer`),

  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  valider: (id: string, presentIds: string[]) =>
    api.post(`/events/${id}/valider`, { presentIds }),

  delete: (id: string) =>
    api.delete(`/events/${id}`),
}
