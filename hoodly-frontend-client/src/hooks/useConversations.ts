import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '../services/api/conversations'

export function useConversations(conversationId?: string) {
  const queryClient = useQueryClient()

  const inboxQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await conversationsApi.getAll()
      return data
    },
    staleTime: 1000 * 5,
  })

  const detailQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const { data } = await conversationsApi.getById(conversationId)
      return data
    },
    enabled: !!conversationId,
  })

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const { data } = await conversationsApi.getMessages(conversationId)
      return data
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  })

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error('Aucune conversation active')
      const { data } = await conversationsApi.sendMessage(conversationId, content)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const startMutation = useMutation({
    mutationFn: async ({ serviceId, destinataireId }: { serviceId?: string; destinataireId: string }) => {
      const { data } = await conversationsApi.getOrCreate(serviceId, destinataireId)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const proposerMutation = useMutation({
    mutationFn: async ({ id, date, debut, fin }: { id: string; date: string; debut: string; fin: string }) => {
      const { data } = await conversationsApi.proposerCreneau(id, date, debut, fin)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const accepterCreneauMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await conversationsApi.accepterCreneau(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const refuserCreneauMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await conversationsApi.refuserCreneau(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  return {
    conversations: inboxQuery.data || [],
    isLoadingInbox: inboxQuery.isLoading,

    conversation: detailQuery.data || null,
    isLoadingDetail: detailQuery.isLoading,

    messages: messagesQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,

    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,

    startConversation: startMutation.mutateAsync,
    isStarting: startMutation.isPending,

    proposerCreneau: proposerMutation.mutateAsync,
    isProposing: proposerMutation.isPending,

    accepterCreneau: accepterCreneauMutation.mutateAsync,
    isAcceptingCreneau: accepterCreneauMutation.isPending,

    refuserCreneau: refuserCreneauMutation.mutateAsync,
    isRefusingCreneau: refuserCreneauMutation.isPending,
  }
}
