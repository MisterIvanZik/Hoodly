import {
  Download,
  Monitor,
  WifiOff,
  ShieldCheck,
  AlertTriangle,
  BarChart2,
  Puzzle
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'

const DOWNLOAD_URL = 'https://github.com/zerck0/Hoodly/releases/download/v1.0.0/hoodly-desktop-1.0-SNAPSHOT.jar'

const features = [
  {
    icon: WifiOff,
    title: 'Mode hors-ligne',
    description: 'Consultez et modifiez les incidents même sans connexion. Les changements se synchronisent automatiquement au retour du réseau.',
  },
  {
    icon: AlertTriangle,
    title: 'Gestion des incidents',
    description: 'Créez, suivez et résolvez les incidents de votre zone directement depuis votre bureau.',
  },
  {
    icon: ShieldCheck,
    title: 'Résolution de conflits',
    description: 'En cas de modification simultanée, l\'app vous propose de choisir entre la version locale et la version serveur.',
  },
  {
    icon: BarChart2,
    title: 'Statistiques & graphiques',
    description: 'Visualisez la répartition des incidents par type, statut et période.',
  },
  {
    icon: Puzzle,
    title: 'Plugins intégrés',
    description: 'Export CSV, analyse sociale, calendrier mensuel — des outils directement dans l\'application.',
  },
]

export default function DesktopAppPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 space-y-10 animate-in fade-in duration-300">

      <div className="text-center space-y-3 py-6">
        <div className="inline-flex p-3 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-2xl text-[#2c308e] dark:text-indigo-400">
          <Monitor className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Application Desktop
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
          Gérez les incidents de votre zone depuis votre ordinateur, même sans connexion internet.
          Réservée aux modérateurs et administrateurs.
        </p>
      </div>

      <Card className="bg-[#0c3383] text-white rounded-[2.5rem] p-8 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">Hoodly Desktop</p>
            <p className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>Version 1.0.0</p>
            <p className="text-xs text-white/60 font-light">Nécessite Java 21 ou supérieur</p>
          </div>
          <a
            href={DOWNLOAD_URL}
            download
            className="flex items-center gap-2 bg-white text-[#0c3383] font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            Télécharger le .jar
          </a>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Fonctionnalités
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-2xs">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="shrink-0 p-2 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-xl text-[#2c308e] dark:text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1 leading-relaxed">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-[1.5rem] shadow-2xs">
        <CardContent className="p-5 flex gap-3 items-start">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300 font-light leading-relaxed">
            Le fichier <strong>.jar</strong> nécessite Java 21. Si Java n'est pas installé, téléchargez-le sur{' '}
            <strong>adoptium.net</strong> puis lancez l'app avec <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">java -jar hoodly-desktop.jar</code>.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
