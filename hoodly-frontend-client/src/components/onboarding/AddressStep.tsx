/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { SearchBox } from '@mapbox/search-js-react'
import { zonesApi } from '../../services/api/zone'
import type { Zone } from '../../types/zone.types'
import { ArrowLeft, MapPin, PlusCircle, CheckCircle } from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface AddressStepProps {
  onNext: (data: { addressData: any; selectedZone: Zone | null; isRequestingNewZone: boolean }) => void
  onBack: () => void
}

function AddressStep({ onNext, onBack }: AddressStepProps) {
  const [addressData, setAddressData] = useState<any>(null)
  const [nearbyZones, setNearbyZones] = useState<Zone[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRetrieve = async (res: any) => {
    setErrorMessage(null)
    const feature = res.features[0]
    setAddressData(feature)
    setIsSearching(true)
    setHasSearched(true)

    try {
      const [lng, lat] = feature.geometry.coordinates
      const { data } = await zonesApi.findNearby(lat, lng)
      setNearbyZones(data)
    } catch (error) {
      console.error('Erreur lors de la recherche de zones:', error)
      setErrorMessage('Impossible de vérifier les quartiers alentours.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectZone = (zone: Zone) => {
    onNext({
      addressData,
      selectedZone: zone,
      isRequestingNewZone: false
    })
  }

  const handleSelectNewZoneRequest = () => {
    if (!addressData) return
    onNext({
      addressData,
      selectedZone: null,
      isRequestingNewZone: true
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">

      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0c3383] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Retour aux informations personnelles</span>
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Où habitez-vous ?
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 font-light max-w-md mx-auto leading-relaxed">
          Entrez votre adresse de résidence pour localiser votre quartier et rejoindre la communauté.
        </p>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-100/50 border border-slate-100 space-y-4">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Adresse de votre domicile
        </label>
        <div className="relative search-box-wrapper">
          <SearchBox
            accessToken={MAPBOX_TOKEN}
            onRetrieve={handleRetrieve}
            placeholder="Saisissez votre adresse..."
            value=""
            options={{ country: 'fr', types: 'address' }}
          />
        </div>
      </div>

      {isSearching && (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0c3383] border-t-transparent"></div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Recherche de quartiers...</span>
        </div>
      )}

      {hasSearched && !isSearching && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium">{errorMessage}</div>
          )}

          {nearbyZones.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100 flex items-start gap-3">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quartiers disponibles</h4>
                  <p className="text-xs text-emerald-700/90 font-light mt-0.5">
                    Bonne nouvelle ! Nous avons trouvé des quartiers Hoodly correspondants à votre secteur.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {nearbyZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-150 p-4 bg-white hover:border-[#0c3383] hover:shadow-xs transition-all duration-200"
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-gray-900 text-sm leading-tight">{zone.nom}</h4>
                      <p className="text-[11px] text-gray-400 font-light flex items-center gap-1">
                        <MapPin size={11} className="text-gray-300" />
                        <span>{zone.ville}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectZone(zone)}
                      className="rounded-xl bg-[#0c3383] hover:bg-opacity-95 text-white px-5 py-2.5 text-xs font-bold shadow-3xs cursor-pointer transition-all hover:scale-102"
                    >
                      Sélectionner
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 rounded-[2rem] bg-blue-50/40 p-8 border border-blue-100/60">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-3xs">
                <span className="text-2xl">📍</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0c3383]">Pas encore de quartier dans cette zone</h3>
                <p className="text-xs text-slate-500 font-light max-w-sm mx-auto leading-relaxed">
                  Soyez le tout premier habitant à lancer Hoodly chez vous et invitez vos voisins à vous rejoindre !
                </p>
              </div>
              <button
                onClick={handleSelectNewZoneRequest}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0c3383] hover:bg-opacity-95 px-6 py-3.5 text-xs font-bold text-white transition-all hover:scale-102 shadow-3xs cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>Demander la création du quartier</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressStep