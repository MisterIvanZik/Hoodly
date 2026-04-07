import api from '../../lib/axios'
import type { User } from '../../types/user.types'

export const usersApi = {
  updateProfile: (data: { name?: string; phone?: string; picture?: string }) =>
    api.patch<User>('/auth/me', data),
}
