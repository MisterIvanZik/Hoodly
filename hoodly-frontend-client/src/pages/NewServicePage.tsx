import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useServices } from '../hooks/useServices'
import { servicesApi } from '../services/api/services'
import {
  ArrowLeft,
  Wrench,
  BookOpen,
  Sprout,
  Dog,
  ShoppingBag,
  Camera,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { toast } from 'sonner'
import type { ServiceType } from '../types/service.types'

const CATEGORY_CARDS = [
  { name: 'Bricolage', icon: Wrench },
  { name: 'Cours', icon: BookOpen },
  { name: 'Jardinage', icon: Sprout },
  { name: 'Animaux', icon: Dog },
  { name: 'Courses', icon: ShoppingBag }
]

const AVAILABLE_DISPOS = [
  { key: 'semaine_matin', label: 'Matinée (Semaine)' },
  { key: 'semaine_aprem', label: 'Après-midi (Semaine)' },
  { key: 'semaine_soir', label: 'Soirée (Semaine)' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' }
]

export default function NewServicePage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialType = searchParams.get('type') === 'demande' ? 'demande' : 'offre'
  const [type, setType] = useState<ServiceType>(initialType)

  const [titre, setTitre] = useState('')
  const [categorie, setCategorie] = useState('Cours')
  const [description, setDescription] = useState('')
  const [gratuit, setGratuit] = useState(false)
  const [points, setPoints] = useState(10)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [recurrente, setRecurrente] = useState(true)
  const [disponibilites, setDisponibilites] = useState<string[]>([])
  const [tarifType, setTarifType] = useState<'horaire' | 'fixe'>('horaire')
  const [planifType, setPlanifType] = useState<'asap' | 'date'>('asap')
  const [datePlanifVal, setDatePlanifVal] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createService } = useServices()

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo est trop volumineuse (max 5 Mo)')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleDispo = (key: string) => {
    setDisponibilites(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titre.trim()) {
      toast.error('Le titre du service est requis')
      return
    }
    if (!categorie) {
      toast.error('Veuillez sélectionner une catégorie')
      return
    }
    if (!description.trim()) {
      toast.error('Veuillez décrire le service')
      return
    }
    if (!gratuit && (points === undefined || points < 1)) {
      toast.error('Le nombre de points doit être supérieur à 0 pour un service payant')
      return
    }
    if (type === 'demande' && planifType === 'date' && !datePlanifVal) {
      toast.error('Veuillez indiquer une date de planification')
      return
    }

    setSubmitting(true)
    try {
      let uploadedPhotoUrl = ''

      if (photoFile) {
        try {
          const uploadRes = await servicesApi.uploadPhoto(photoFile)
          uploadedPhotoUrl = uploadRes.data.fileUrl
        } catch {
          toast.error("Erreur lors de l'envoi de la photo. Enregistrement en cours sans photo...")
        }
      }

      await createService({
        titre,
        description,
        type,
        categorie,
        gratuit,
        points: gratuit ? undefined : points,
        zoneId: user?.zoneId,
        photoUrl: uploadedPhotoUrl || undefined,
        recurrente: type === 'offre' ? recurrente : undefined,
        disponibilites: type === 'offre' ? disponibilites : undefined,
        datePlanification: type === 'demande'
          ? (planifType === 'asap' ? 'Dès que possible (urgent)' : datePlanifVal)
          : undefined
      })

      toast.success(
        type === 'offre'
          ? 'Votre offre a été publiée avec succès !'
          : 'Votre demande a été publiée avec succès !'
      )
      navigate('/services')
    } catch {
      toast.error("Une erreur est survenue lors de la publication.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate('/services')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Retour au catalogue</span>
      </button>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {type === 'offre' ? 'Proposez un Service' : 'Demandez un Service'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-light leading-relaxed">
            {type === 'offre'
              ? 'Partagez vos compétences avec vos voisins et offrez vos disponibilités.'
              : 'Sollicitez de l\'aide auprès de vos voisins et fixez votre calendrier.'}
          </p>
        </div>

        <div className="flex bg-gray-50 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setType('offre')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              type === 'offre'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Je propose mes services (Offre)
          </button>
          <button
            type="button"
            onClick={() => setType('demande')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              type === 'demande'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Je recherche de l'aide (Demande)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {type === 'offre' ? 'QUEL SERVICE PROPOSEZ-VOUS ?' : 'QUEL SERVICE RECHERCHEZ-VOUS ?'}
            </label>
            <Input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={type === 'offre' ? "ex: Cours d'anglais, Jardinage, Conseils en Python..." : "ex: Aide pour déménager, Tonte de pelouse..."}
              className="h-12 rounded-xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              CATÉGORIE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {CATEGORY_CARDS.map((card) => {
                const isSelected = categorie === card.name
                return (
                  <button
                    key={card.name}
                    type="button"
                    onClick={() => setCategorie(card.name)}
                    disabled={submitting}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 bg-white'
                    }`}
                  >
                    <card.icon className="h-6 w-6 mb-2" />
                    <span className="text-xs font-semibold">{card.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              DÉTAILS DU SERVICE
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'offre' ? "Décrivez votre service, vos compétences, vos disponibilités régulières et votre expérience..." : "Décrivez la tâche précise à accomplir, le matériel requis et tout autre détail utile..."}
              className="min-h-[140px] rounded-2xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm leading-relaxed p-4"
              disabled={submitting}
            />
          </div>

          {type === 'offre' && (
            <div className="space-y-6 animate-in fade-in duration-300">
             <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  FRÉQUENCE DU SERVICE
                </label>
                <div className="flex bg-gray-50 rounded-xl p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setRecurrente(true)}
                    disabled={submitting}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      recurrente
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Récurrent / Régulier
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurrente(false)}
                    disabled={submitting}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      !recurrente
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Prestation ponctuelle
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  DISPONIBILITÉS (QUAND POUVEZ-VOUS AIDER ?)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_DISPOS.map((dispo) => {
                    const isSelected = disponibilites.includes(dispo.key)
                    return (
                      <button
                        key={dispo.key}
                        type="button"
                        onClick={() => toggleDispo(dispo.key)}
                        disabled={submitting}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#2c308e] text-white border-[#2c308e] shadow-sm'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {dispo.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {type === 'demande' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  PLANIFICATION (QUAND AVEZ-VOUS BESOIN D'AIDE ?)
                </label>
                <div className="flex bg-gray-50 rounded-xl p-1 w-fit mb-4">
                  <button
                    type="button"
                    onClick={() => setPlanifType('asap')}
                    disabled={submitting}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      planifType === 'asap'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    ⚡ Dès que possible (urgent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanifType('date')}
                    disabled={submitting}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      planifType === 'date'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    📅 Date spécifique
                  </button>
                </div>

                {planifType === 'date' && (
                  <div className="w-56 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      type="date"
                      value={datePlanifVal}
                      onChange={(e) => setDatePlanifVal(e.target.value)}
                      className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e]"
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'offre' ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                TARIFICATION DU SERVICE
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setGratuit(false)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Payant (Points)
                </button>
                <button
                  type="button"
                  onClick={() => setGratuit(true)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Gratuit / Entraide
                </button>
              </div>

              {!gratuit && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex bg-gray-50 rounded-xl p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setTarifType('horaire')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        tarifType === 'horaire'
                          ? 'bg-white text-[#2c308e] shadow-sm'
                          : 'text-gray-400'
                      }`}
                    >
                      Tarif horaire
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarifType('fixe')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        tarifType === 'fixe'
                          ? 'bg-white text-[#2c308e] shadow-sm'
                          : 'text-gray-400'
                      }`}
                    >
                      Forfait fixe
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min={1}
                        value={points}
                        onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
                        className="h-10 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2c308e] text-center font-bold text-[#1f224e]"
                        disabled={submitting}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#1f224e] uppercase tracking-wider">
                      POINTS {tarifType === 'horaire' ? '/ HEURE' : '/ PRESTATION'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                BUDGET EN POINTS ALLOUÉ
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setGratuit(false)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Proposer des Points
                </button>
                <button
                  type="button"
                  onClick={() => setGratuit(true)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Gratuit / Entraide bénévole
                </button>
              </div>

              {!gratuit && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative w-28">
                    <Input
                      type="number"
                      min={1}
                      value={points}
                      onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
                      className="h-10 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2c308e] text-center font-bold text-[#1f224e]"
                      disabled={submitting}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#1f224e] uppercase tracking-wider">POINTS POUR LA TÂCHE</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              PHOTOS
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div
              onClick={handlePhotoClick}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed cursor-pointer transition-colors ${
                photoPreview
                  ? 'border-gray-300 bg-gray-50/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
              }`}
            >
              {photoPreview ? (
                <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={submitting}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Camera className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-[#1f224e]">Cliquez pour ajouter des photos</p>
                  <p className="text-[10px] text-gray-400 mt-1">Format JPG, PNG (Max 5Mo)</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-sm rounded-2xl py-6 transition-all hover:scale-101 flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publication en cours...</span>
                </>
              ) : (
                <>
                  <span>Publier l'annonce ▷</span>
                </>
              )}
            </Button>
            <p className="text-[10px] text-gray-400 text-center">
              En publiant, vous acceptez la charte de bon voisinage de HOODLY.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
