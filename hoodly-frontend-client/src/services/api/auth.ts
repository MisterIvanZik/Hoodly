import api from '../../lib/axios'
import type { User } from '../../types/user.types'

export const authApi = {
  syncUser: () => api.post<User>('/auth/me'),

  getMe: () => api.get<User>('/auth/me'),
}
