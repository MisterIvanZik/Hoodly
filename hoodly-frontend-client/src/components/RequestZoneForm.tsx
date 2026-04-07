import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zonesApi } from '../services/api/zone'
import { useAuthStore } from '../stores/auth.store'

interface RequestZoneFormProps {
  onClose: () => void
}

function RequestZoneForm({ onClose }: RequestZoneFormProps) {
  const navigate = useNavigate()
  const updateUser = useAuthStore((state) => state.updateUser)

  const [nomQuartier, setNomQuartier] = useState('')
  const [ville, setVille] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await zonesApi.createZoneRequest({
        nomQuartier,
        ville,
        codePostal,
        description,
      })

      updateUser({ zoneStatut: 'en_attente_zone' })
      navigate('/waiting')
    } catch {
      setError('Erreur lors de l envoi de la demande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Demander la création d un quartier
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nom du quartier
            </label>
            <input
              type="text"
              value={nomQuartier}
              onChange={(e) => setNomQuartier(e.target.value)}
              placeholder="Ex: Belleville"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Ville</label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex: Paris"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Code postal
            </label>
            <input
              type="text"
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="Ex: 75020"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement votre quartier..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequestZoneForm
