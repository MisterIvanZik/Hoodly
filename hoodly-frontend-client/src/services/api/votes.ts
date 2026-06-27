import api from '../../lib/axios'
import type { Vote, CreateVoteDto } from '../../types/vote.types'

export const votesApi = {
  getAllByZone: (zoneId: string) => 
    api.get<Vote[]>(`/votes/zone/${zoneId}`),

  getById: (id: string) => 
    api.get<Vote>(`/votes/${id}`),

  create: (data: CreateVoteDto) => 
    api.post<Vote>('/votes', data),

  castVote: (id: string, option: string) => 
    api.post<Vote>(`/votes/${id}/vote`, { option }),

  close: (id: string) => 
    api.patch<Vote>(`/votes/${id}/close`),

  approve: (id: string, isAnonymous?: boolean) => 
    api.patch<Vote>(`/votes/${id}/approve`, { isAnonymous }),

  reject: (id: string, reason: string) => 
    api.patch<Vote>(`/votes/${id}/reject`, { reason }),

  delete: (id: string) => 
    api.delete<{ message: string }>(`/votes/${id}`),
}
