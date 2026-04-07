import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zonesApi } from '../services/api/zone'
import { useAuthStore } from '../stores/auth.store'
import type { Zone } from '../types/zone.types'

interface JoinZoneModalProps {
  selectedZone: Zone | null
  onClose: () => void
}

function JoinZoneModal({ selectedZone, onClose }: JoinZoneModalProps) {
  const navigate = useNavigate()
  const updateUser = useAuthStore((state) => state.updateUser)

  const [zoneId, setZoneId] = useState(selectedZone?.id ?? '')
  const [justificatif, setJustificatif] = useState<File | null>(null)
  const [pieceIdentite, setPieceIdentite] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<'justificatif' | 'piece' | 'done'>(
    'justificatif',
  )

  const handleUpload = async (file: File): Promise<string> => {
    const { data } = await zonesApi.uploadFile(file)
    return data.fileUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!zoneId) {
      setError('Veuillez sélectionner un quartier')
      return
    }
    if (!justificatif || !pieceIdentite) {
      setError('Veuillez uploader les deux documents')
      return
    }

    setLoading(true)

    try {
      const justificatifUrl = await handleUpload(justificatif)
      const pieceIdentiteUrl = await handleUpload(pieceIdentite)

      await zonesApi.createMembership({
        zoneId,
        justificatifUrl,
        pieceIdentiteUrl,
      })

      updateUser({ zoneStatut: 'en_attente_adh' })
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
          <h3 className="text-lg font-semibold">Rejoindre un quartier</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedZone && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                ID du quartier
              </label>
              <input
                type="text"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                placeholder="Entrez l ID du quartier"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          )}

          {selectedZone && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Quartier sélectionné : <strong>{selectedZone.nom}</strong> ({selectedZone.ville})
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Justificatif de domicile (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setJustificatif(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Pièce d identité (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setPieceIdentite(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
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

export default JoinZoneModal
