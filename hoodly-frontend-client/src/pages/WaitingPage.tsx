import { useAuthStore } from '../stores/auth.store'

function WaitingPage() {
  const user = useAuthStore((state) => state.user)

  const messages: Record<string, { title: string; desc: string }> = {
    en_attente_adh: {
      title: 'Demande d\'adhésion envoyée',
      desc: 'Votre demande pour rejoindre le quartier est en cours de traitement par un administrateur.',
    },
    en_attente_zone: {
      title: 'Demande de création envoyée',
      desc: 'Votre demande de création de quartier est en cours de traitement par un administrateur.',
    },
  }

  const message = user ? messages[user.zoneStatut] : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ed]">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="mb-3 text-2xl font-bold">
          {message?.title ?? 'Demande en cours de traitement'}
        </h1>
        <p className="text-gray-500">
          {message?.desc ??
            'Votre demande sera traitée par un administrateur dans les plus brefs délais.'}
        </p>
      </div>
    </div>
  )
}

export default WaitingPage
