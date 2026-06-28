export type VoteStatus = 'pending' | 'active' | 'rejected' | 'closed'

export interface VotedUser {
  userId?: string
  option: string
  votedAt?: string
}

export interface Vote {
  _id: string
  zoneId: string
  creatorId: string
  title: string
  description?: string
  options: string[]
  expirationDate: string
  votedUsers: VotedUser[]
  status: VoteStatus
  refusalReason?: string
  isAnonymous: boolean
  resultPosted: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateVoteDto {
  zoneId: string
  title: string
  description?: string
  options: string[]
  expirationDate?: string
  isAnonymous?: boolean
}
