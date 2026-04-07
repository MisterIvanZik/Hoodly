import { useState } from 'react'
import ZoneMap from './ZoneMap'
import JoinZoneModal from './JoinZoneModal'
import RequestZoneForm from './RequestZoneForm'
import type { Zone } from '../types/zone.types'

function StepZoneSelection() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)

  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone)
    setShowJoinModal(true)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-xl font-semibold">Trouver son quartier</h2>
      <p className="mb-6 text-sm text-gray-500">
        Cliquez sur un quartier sur la carte pour le rejoindre, ou demandez la
        création d'un nouveau quartier.
      </p>

      <ZoneMap onZoneSelect={handleZoneSelect} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Rejoindre un quartier
        </button>
        <button
          onClick={() => setShowRequestForm(true)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Mon quartier n'existe pas
        </button>
      </div>

      {showJoinModal && (
        <JoinZoneModal
          selectedZone={selectedZone}
          onClose={() => {
            setShowJoinModal(false)
            setSelectedZone(null)
          }}
        />
      )}

      {showRequestForm && (
        <RequestZoneForm
          onClose={() => setShowRequestForm(false)}
        />
      )}
    </div>
  )
}

export default StepZoneSelection
