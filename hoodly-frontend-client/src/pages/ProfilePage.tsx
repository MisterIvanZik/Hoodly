import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../hooks/useUser'
import { servicesApi } from '../services/api/services'
import { zonesApi } from '../services/api/zone'
import { usersApi } from '../services/api/user'
import { conversationsApi } from '../services/api/conversations'
import { postsApi } from '../services/api/posts'
import {
  Camera,
  Mail,
  Phone,
  User as UserIcon,
  Loader2,
  Check,
  FileText,
  CheckCircle2,
  Circle,
  HeartHandshake,
  Trash2,
  Edit2,
  X,
  MapPin,
  Calendar
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import type { Service } from '../types/service.types'

interface Mission {
  id: string
  title: string
  description: string
  points: number
  isCompleted: boolean
  progressText: string
}

const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string, badgeBg: string }> = {
  Jardinage: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-700', border: 'border-l-4 border-l-emerald-500', badgeBg: 'bg-emerald-100/60' },
  Bricolage: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-700', border: 'border-l-4 border-l-amber-500', badgeBg: 'bg-amber-100/60' },
  Cours: { bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-700', border: 'border-l-4 border-l-blue-500', badgeBg: 'bg-blue-100/60' },
  Garde: { bg: 'bg-rose-50 text-rose-700 border-rose-100', text: 'text-rose-700', border: 'border-l-4 border-l-rose-500', badgeBg: 'bg-rose-100/60' },
  Courses: { bg: 'bg-teal-50 text-teal-700 border-teal-100', text: 'text-teal-700', border: 'border-l-4 border-l-teal-500', badgeBg: 'bg-teal-100/60' },
  Animaux: { bg: 'bg-purple-50 text-purple-700 border-purple-100', text: 'text-purple-700', border: 'border-l-4 border-l-purple-500', badgeBg: 'bg-purple-100/60' }
}

const DEFAULT_STYLE = { bg: 'bg-gray-50 text-gray-700 border-gray-100', text: 'text-gray-700', border: 'border-l-4 border-l-gray-400', badgeBg: 'bg-gray-100/60' }

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, refreshProfile } = useUser()

  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [picture, setPicture] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [civility, setCivility] = useState('')
  const [residentType, setResidentType] = useState('')
  const [material, setMaterial] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPoints, setEditPoints] = useState(0)
  const [editDescription, setEditDescription] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const parts = user.name ? user.name.split(' ') : []
      setFirstName(user.firstName ?? parts[0] ?? '')
      setLastName(user.lastName ?? parts.slice(1).join(' ') ?? '')
      setName(user.name ?? '')
      setPhone(user.phone ?? '')
      setBio(user.bio ?? '')
      setPicture(user.picture ?? '')
      setBirthDate(user.birthDate ?? '')
      setCivility(user.civility ?? '')
      setResidentType(user.residentType ?? '')
      setMaterial(user.material ?? '')
      setInterests(user.interests ?? [])
    }
  }, [user])

  const { data: myZone } = useQuery({
    queryKey: ['my-zone'],
    queryFn: async () => {
      const { data } = await zonesApi.getMyZone()
      return data
    },
    enabled: !!user?.zoneId,
  })

  const { data: createdServicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['my-created-services', user?.id],
    queryFn: async () => {
      if (!user?.id) return { services: [], total: 0 }
      const { data } = await servicesApi.getAll({ createurId: user.id, limit: 100 })
      return data
    },
    enabled: !!user?.id,
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['my-conversations'],
    queryFn: async () => {
      const { data } = await conversationsApi.getAll()
      return data
    },
    enabled: !!user?.id
  })

  const { data: feedData } = useQuery({
    queryKey: ['my-zone-feed', user?.zoneId],
    queryFn: async () => {
      if (!user?.zoneId) return { data: [], nextCursor: null }
      const { data } = await postsApi.getFeed(user.zoneId, undefined, 100)
      return data
    },
    enabled: !!user?.zoneId
  })

  const hasMessages = conversations.length > 0
  const hasPosts = (feedData?.data || []).some(
    (post) => post.author === user?.id || post.author === user?.auth0Id
  )

  const createdServices = createdServicesData?.services || []

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      bio: string;
      picture: string;
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      civility?: string;
      residentType?: string;
      languages?: string;
      material?: string;
      interests?: string[];
    }) => {
      const response = await usersApi.updateProfile(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      refreshProfile()
      toast.success('Profil enregistré avec succès !')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil')
    }
  })

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await servicesApi.update(id, data as any)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-services'] })
      setEditingServiceId(null)
      toast.success('Service mis à jour avec succès !')
    },
    onError: () => {
      toast.error('Erreur lors de la modification du service')
    }
  })

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await servicesApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-services'] })
      setConfirmDeleteId(null)
      toast.success('Service supprimé avec succès !')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du service')
    }
  })

  const completeServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await servicesApi.terminer(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-created-services'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      refreshProfile()
      toast.success('Félicitations ! Le service est clôturé et les points sont accordés !')
    },
    onError: () => {
      toast.error('Erreur lors de la clôture du service')
    }
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data } = await zonesApi.uploadFile(file)
      setPicture(data.fileUrl)

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      updateProfileMutation.mutate({
        name: fullName || name,
        phone,
        bio,
        picture: data.fileUrl,
        firstName,
        lastName,
        birthDate,
        civility,
        residentType,
        interests,
        material
      })
    } catch {
      toast.error('Erreur lors du téléchargement de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le prénom et le nom sont obligatoires')
      return
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    updateProfileMutation.mutate({
      name: fullName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      picture,
      birthDate,
      civility,
      residentType,
      interests,
      material: material.trim(),
    })
  }

  const handleStartEditService = (service: Service) => {
    setEditingServiceId(service._id)
    setEditTitle(service.titre)
    setEditPoints(service.points || 0)
    setEditDescription(service.description)
  }

  const handleSaveServiceEdit = (id: string) => {
    if (!editTitle.trim()) {
      toast.error('Le titre est obligatoire')
      return
    }
    updateServiceMutation.mutate({
      id,
      data: {
        titre: editTitle,
        points: editPoints,
        description: editDescription
      }
    })
  }

  const hasChanges = user
    ? firstName !== (user.firstName ?? '') ||
      lastName !== (user.lastName ?? '') ||
      phone !== (user.phone ?? '') ||
      bio !== (user.bio ?? '') ||
      picture !== (user.picture ?? '') ||
      birthDate !== (user.birthDate ?? '') ||
      civility !== (user.civility ?? '') ||
      residentType !== (user.residentType ?? '') ||
      material !== (user.material ?? '') ||
      JSON.stringify(interests) !== JSON.stringify(user.interests ?? [])
    : false

  const missionsList: Mission[] = [
    {
      id: 'discussion',
      title: 'Discussion active',
      description: 'Lancer ou participer à une discussion en écrivant un message à un voisin.',
      points: 20,
      isCompleted: hasMessages,
      progressText: hasMessages ? '20 / 20 pts (Reçus)' : '0 / 20 pts'
    },
    {
      id: 'first_post',
      title: 'Premier pas sur le feed',
      description: 'Partagez votre première publication (discussion ou alerte) sur le fil d\'actualité de quartier.',
      points: 30,
      isCompleted: hasPosts,
      progressText: hasPosts ? '30 / 30 pts (Reçus)' : '0 / 30 pts'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">

      <div>
        <h1 className="text-4xl font-extrabold text-[#1e224e] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mon Espace Profil
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm font-light leading-relaxed">
          Gérez vos informations d'habitant, modifiez vos coordonnées et suivez vos missions de quartier.
        </p>
      </div>

      <Card className="border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-[#0c3383]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-white min-h-[220px]">

          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group shrink-0">
              <Avatar className="h-32 w-32 border-[5px] border-white shadow-xl rounded-[1.8rem] overflow-hidden bg-slate-100">
                <AvatarImage src={picture} className="object-cover animate-in fade-in duration-200" />
                <AvatarFallback className="bg-slate-200 text-gray-800 text-4xl font-black">
                  {name.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 bg-black/45 rounded-[1.8rem] flex items-center justify-center text-white z-10">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 border-2 border-white rounded-full p-1.5 text-white shadow-sm shrink-0 z-20">
                <Check className="h-3.5 w-3.5 stroke-[3.5px]" />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/35 text-white rounded-[1.8rem] flex items-center justify-center transition-all cursor-pointer z-10"
                title="Changer la photo"
                disabled={uploading}
              >
                <Camera size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-4xl font-black tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {name || 'Julien Bernard'}
              </h2>

              <div className="flex flex-wrap items-center justify-center md:justify-start mt-2.5 text-sm font-light text-white/90">
                <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-xs select-none">
                  <MapPin size={14} className="text-white/80" />
                  <span>Quartier : <strong>{myZone?.nom || 'Saint-Gilles Sud'}</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
            <div className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-6 py-3.5 rounded-2xl text-center min-w-[130px] shadow-sm select-none">
              <span className="text-[9px] font-extrabold tracking-wider uppercase text-white/60 block font-sans">SOLDE DE POINTS</span>
              <span className="text-3xl font-black leading-none mt-0.5 block" style={{ fontFamily: "'Outfit', sans-serif" }}>
                🪙 {(user?.points ?? 1240).toLocaleString()}
              </span>
            </div>
          </div>

        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        <div className="lg:col-span-3 space-y-8">

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-[#0c2b76] tracking-tight flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <HeartHandshake className="h-5 w-5 text-[#0c3383]" />
                <span>Mes services proposés au quartier</span>
              </h3>
            </div>

            <div>
              {isLoadingServices ? (
                <div className="flex justify-center p-12 bg-white rounded-3xl border border-gray-100">
                  <Loader2 className="animate-spin text-[#0c3383]" size={32} />
                </div>
              ) : createdServices.length === 0 ? (
                <Card className="p-12 bg-white border border-dashed rounded-[2rem] text-center border-gray-200">
                  <HeartHandshake className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-gray-800">Aucun service proposé pour le moment</h4>
                  <p className="text-[10px] text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed font-light">
                    Proposez un service de bricolage, jardinage ou aide aux devoirs pour faire vivre votre quartier.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence mode="popLayout">
                    {createdServices.map((service) => {
                      const isEditing = editingServiceId === service._id
                      const isConfirmingDelete = confirmDeleteId === service._id
                      const style = CATEGORY_STYLES[service.categorie] || DEFAULT_STYLE

                      return (
                        <motion.div
                          key={service._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            className={`bg-white rounded-3xl border overflow-hidden flex flex-col justify-between transition-all relative ${
                              isEditing ? 'border-[#0c3383] ring-1 ring-[#0c3383]/10' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >

                            <div className="px-4 py-2 bg-slate-50 border-b border-gray-50 flex items-center justify-between gap-2 shrink-0">
                              <Badge className={`border ${style.bg} ${style.text} hover:bg-white text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded`}>
                                {service.categorie}
                              </Badge>

                              <div className="flex items-center gap-1.5">
                                {service.statut === 'en_cours' && (
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                  </span>
                                )}
                                <Badge className={`text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded ${
                                  service.statut === 'actif'
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                    : service.statut === 'en_cours'
                                    ? 'bg-amber-50 border border-amber-100 text-amber-700'
                                    : 'bg-gray-100 border border-gray-200 text-gray-500'
                                }`}>
                                  {service.statut === 'actif' ? 'Actif' : service.statut === 'en_cours' ? 'En Cours' : 'Clôturé'}
                                </Badge>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Titre du service</label>
                                    <Input
                                      type="text"
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="h-8.5 rounded-lg text-xs font-light px-2"
                                      required
                                    />
                                  </div>

                                  {!service.gratuit && (
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Montant en points (🪙)</label>
                                      <Input
                                        type="number"
                                        value={editPoints}
                                        onChange={(e) => setEditPoints(Number(e.target.value))}
                                        className="h-8.5 rounded-lg text-xs font-light px-2 w-28"
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                    <Textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      rows={2}
                                      className="rounded-lg text-xs font-light px-2 py-1 resize-none min-h-[50px]"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                                  <Button
                                    variant="ghost"
                                    className="h-8 text-[9px] font-bold px-3 rounded-lg text-gray-500 hover:bg-slate-100"
                                    onClick={() => setEditingServiceId(null)}
                                    disabled={updateServiceMutation.isPending}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    className="h-8 bg-[#0c3383] hover:bg-[#0c3383]/95 text-white text-[9px] font-bold px-3 rounded-lg flex items-center gap-1 shadow-xs"
                                    onClick={() => handleSaveServiceEdit(service._id)}
                                    disabled={updateServiceMutation.isPending}
                                  >
                                    {updateServiceMutation.isPending ? (
                                      <Loader2 className="animate-spin h-3 w-3" />
                                    ) : (
                                      <Check size={11} className="stroke-[2.5px]" />
                                    )}
                                    <span>Enregistrer</span>
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="p-4 space-y-2 flex-1">
                                  <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
                                    {service.titre}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed font-light">
                                    {service.description}
                                  </p>
                                </div>

                                <div className="border-t border-gray-50 px-4 py-3 bg-slate-50/40 flex items-center justify-between gap-4 shrink-0">
                                  <span className="text-xs font-extrabold text-[#0c3383]">
                                    🪙 {service.gratuit ? 'Gratuit' : `${service.points} pts`}
                                    {!service.gratuit && <span className="text-[9px] text-gray-400 font-light">/h</span>}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    {service.statut === 'en_cours' && (
                                      <Button
                                        onClick={() => completeServiceMutation.mutate(service._id)}
                                        disabled={completeServiceMutation.isPending}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold h-7.5 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check size={10} className="stroke-[3px]" />
                                        <span>Clôturer</span>
                                      </Button>
                                    )}

                                    {service.statut !== 'termine' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7.5 w-7.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg shrink-0 cursor-pointer"
                                          onClick={() => handleStartEditService(service)}
                                          title="Modifier"
                                        >
                                          <Edit2 size={11.5} />
                                        </Button>

                                        {isConfirmingDelete ? (
                                          <div className="flex items-center gap-1 z-30">
                                            <Button
                                              onClick={() => deleteServiceMutation.mutate(service._id)}
                                              disabled={deleteServiceMutation.isPending}
                                              className="bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-bold h-7.5 px-2 rounded-lg"
                                            >
                                              {deleteServiceMutation.isPending ? <Loader2 className="animate-spin h-2.5 w-2.5" /> : 'Confirmer'}
                                            </Button>
                                            <Button
                                              onClick={() => setConfirmDeleteId(null)}
                                              variant="ghost"
                                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-150 p-1 h-7.5 w-7.5 rounded-lg"
                                            >
                                              <X size={11} />
                                            </Button>
                                          </div>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7.5 w-7.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                                            onClick={() => setConfirmDeleteId(service._id)}
                                            title="Supprimer"
                                          >
                                            <Trash2 size={11.5} />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          <Card className="bg-[#0c3383] text-white rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

            <div className="space-y-2 max-w-xl text-center md:text-left z-10">
              <h3 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Envie d'aider vos voisins ?
              </h3>
              <p className="text-xs text-white/80 font-light leading-relaxed">
                Ajoutez un nouveau service ou créez un événement communautaire pour gagner des points de confiance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0 z-10 w-full md:w-auto justify-center">
              <Button
                onClick={() => navigate('/services/nouveau')}
                className="bg-white hover:bg-slate-50 text-[#0c3383] rounded-xl font-bold px-6 py-5.5 text-xs shadow-sm cursor-pointer transition-all hover:scale-102"
              >
                Nouveau Service
              </Button>
              <Button
                onClick={() => {
                  toast.info("Fonctionnalité d'événement communautaire à venir bientôt !")
                }}
                className="bg-transparent hover:bg-white/10 text-white border border-white/30 rounded-xl font-bold px-6 py-5.5 text-xs cursor-pointer transition-all hover:scale-102"
              >
                Créer Événement
              </Button>
            </div>
          </Card>

        </div>

        <div className="lg:col-span-2 space-y-6">

          <Card className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-gray-100 p-6">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">Informations Personnelles</CardTitle>
                <CardDescription className="text-[10px] text-gray-400 font-light mt-0.5">
                  Modifiez vos coordonnées de contact et présentez-vous à votre quartier.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleSave} className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Prénom
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Julien"
                        className="pl-9 h-10 rounded-xl text-xs font-light border-gray-200 focus:border-[#0c3383]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="lastName" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Nom de famille
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Bernard"
                        className="pl-9 h-10 rounded-xl text-xs font-light border-gray-200 focus:border-[#0c3383]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="civility" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Civilité
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <select
                        id="civility"
                        value={civility}
                        onChange={(e) => setCivility(e.target.value)}
                        className="pl-9 h-10 w-full rounded-xl text-xs font-light border border-gray-200 bg-white focus:border-[#0c3383] focus:outline-none transition-colors select-none"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Monsieur">Monsieur</option>
                        <option value="Madame">Madame</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="birthDate" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Date de naissance
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-xs font-light border-gray-200 focus:border-[#0c3383]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="phone" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +33 6 12 34 56 78"
                      className="pl-9 h-10 rounded-xl text-xs font-light border-gray-200 focus:border-[#0c3383]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                    Adresse Email (Non modifiable)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-9 h-10 rounded-xl text-xs font-light bg-slate-50 cursor-not-allowed text-gray-400 border-gray-150"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="bio" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                    Biographie (À propos de moi)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Décrivez qui vous êtes, vos passions et vos compétences pour vos voisins."
                      rows={3}
                      className="pl-9 rounded-xl text-xs font-light resize-none min-h-[85px] border-gray-200 focus:border-[#0c3383]"
                    />
                  </div>
                </div>

              </form>
            </CardContent>

            <CardFooter className="border-t border-gray-100 p-5 bg-slate-50/50 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending || !hasChanges}
                className="bg-[#0c3383] hover:bg-[#0c3383]/95 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 h-10 px-5 cursor-pointer hover:scale-102 transition-all"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                ) : (
                  <Check size={14} className="stroke-[2.5px]" />
                )}
                <span>Enregistrer</span>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Missions de quartier
              </h4>
              <Badge className="bg-amber-50 border border-amber-100 text-amber-700 text-[8px] font-extrabold tracking-wider px-2 py-0.5 rounded">
                Gagner du Solde
              </Badge>
            </div>

            <div className="space-y-3.5">
              {missionsList.map((mission) => (
                <div
                  key={mission.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    mission.isCompleted
                      ? 'bg-emerald-50/20 border-emerald-100/60'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {mission.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold truncate ${mission.isCompleted ? 'text-gray-900 line-through opacity-60' : 'text-gray-900'}`}>
                        {mission.title}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${
                        mission.isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-indigo-50 text-[#0c3383] border-indigo-100'
                      }`}>
                        {mission.isCompleted ? 'Réussie' : `+${mission.points} pts`}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-light mt-1 leading-snug">
                      {mission.description}
                    </p>

                    <div className="flex justify-between text-[8px] font-bold text-gray-400 mt-2.5 pt-2 border-t border-gray-100/30">
                      <span>Progression</span>
                      <span>{mission.progressText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  )
}
