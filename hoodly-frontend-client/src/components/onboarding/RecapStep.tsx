/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from '../../stores/auth.store'
import type { Zone } from '../../types/zone.types'
import { motion } from 'motion/react'
import { User, Calendar, Phone, MapPin, Check, Edit2, AlertCircle, Sparkles } from 'lucide-react'

interface RecapStepProps {
  addressData: any
  selectedZone: Zone | null
  isRequestingNewZone: boolean
  onBackToStep1: () => void
  onBackToStep2: () => void
  onConfirm: () => void
  isSubmitting: boolean
  errorMessage: string | null
}

function RecapStep({
  addressData,
  selectedZone,
  isRequestingNewZone,
  onBackToStep1,
  onBackToStep2,
  onConfirm,
  isSubmitting,
  errorMessage
}: RecapStepProps) {
  const user = useAuthStore((state) => state.user)

  const formattedAddress = addressData?.properties?.full_address || addressData?.properties?.place_name || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-xl bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-100/50 border border-slate-100 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center mb-8">

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0c3383] text-[10px] font-extrabold tracking-wider uppercase mb-2">
          <Sparkles size={11} className="animate-pulse" />
          <span>Dernière étape !</span>
        </div>

        <h2 className="text-2xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Vérifiez vos informations
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 font-light max-w-md mx-auto leading-relaxed">
          Assurez-vous que tout est correct avant de finaliser votre inscription sur Hoodly.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-150 p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Informations Personnelles
            </h3>
            <button
              onClick={onBackToStep1}
              className="flex items-center gap-1 text-[10px] font-bold text-[#0c3383] hover:underline cursor-pointer"
            >
              <Edit2 size={10} />
              <span>Modifier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-gray-600">
              <User size={14} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-medium">Nom complet</span>
                <span className="font-semibold text-gray-800">{user?.name || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-gray-600">
              <User size={14} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-medium">Civilité</span>
                <span className="font-semibold text-gray-800">{user?.civility || 'Non spécifiée'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-gray-600">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-medium">Date de naissance</span>
                <span className="font-semibold text-gray-800">
                  {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-gray-600">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-medium">Téléphone</span>
                <span className="font-semibold text-gray-800">{user?.phone || 'Non renseigné'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-150 p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Adresse & Quartier
            </h3>
            <button
              onClick={onBackToStep2}
              className="flex items-center gap-1 text-[10px] font-bold text-[#0c3383] hover:underline cursor-pointer"
            >
              <Edit2 size={10} />
              <span>Modifier</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-gray-600">
            <div className="flex items-start gap-2.5">
              <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-medium">Votre Adresse</span>
                <span className="font-medium text-gray-800">{formattedAddress || 'Adresse introuvable'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <span className="text-[9px] text-gray-400 block uppercase font-medium mb-1.5">Action sur le quartier</span>
              {isRequestingNewZone ? (
                <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3 flex items-start gap-2">
                  <span className="text-base">🚀</span>
                  <div>
                    <span className="font-bold text-blue-900 block leading-tight text-xs">Création de quartier demandée</span>
                    <span className="text-[10px] text-blue-700/80 font-light mt-0.5 block">
                      Ce secteur n'a pas encore de communauté active. Une demande de création sera envoyée à nos modérateurs.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 flex items-start gap-2">
                  <span className="text-base">🏡</span>
                  <div>
                    <span className="font-bold text-emerald-900 block leading-tight text-xs">Rejoindre le quartier existant</span>
                    <span className="text-xs font-extrabold text-emerald-800 mt-0.5 block">
                      {selectedZone?.nom} — {selectedZone?.ville}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#0c3383] py-4 text-xs font-bold text-white transition-all hover:bg-opacity-95 hover:scale-102 disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-blue-900/10 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Check size={14} className="stroke-[3px]" />
            )}
            <span>
              {isRequestingNewZone
                ? 'Confirmer & Demander la création'
                : 'Confirmer & Rejoindre le quartier'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default RecapStep
