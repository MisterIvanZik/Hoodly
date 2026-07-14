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
import { useTranslation } from 'react-i18next'

const DOWNLOAD_URL = 'https://github.com/zerck0/Hoodly/releases/download/v1.0.0/hoodly-desktop-1.0-SNAPSHOT.jar'

const features = [
  {
    icon: WifiOff,
    key: 'offline',
  },
  {
    icon: AlertTriangle,
    key: 'incidents',
  },
  {
    icon: ShieldCheck,
    key: 'conflict',
  },
  {
    icon: BarChart2,
    key: 'stats',
  },
  {
    icon: Puzzle,
    key: 'plugins',
  },
]

export default function DesktopAppPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 space-y-10 animate-in fade-in duration-300">

      <div className="text-center space-y-3 py-6">
        <div className="inline-flex p-3 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-2xl text-[#2c308e] dark:text-indigo-400">
          <Monitor className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t("desktop.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
          {t("desktop.subtitle")}
        </p>
      </div>

      <Card className="bg-[#0c3383] text-white rounded-[2.5rem] p-8 border-0 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">{t("desktop.appName")}</p>
            <p className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>{t("desktop.version", { version: "1.0.0" })}</p>
            <p className="text-xs text-white/60 font-light">{t("desktop.requirements")}</p>
          </div>
          <a
            href={DOWNLOAD_URL}
            download
            className="flex items-center gap-2 bg-white text-[#0c3383] font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            {t("desktop.downloadButton")}
          </a>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t("desktop.featuresTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, key }) => (
            <Card key={key} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-2xs">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="shrink-0 p-2 bg-[#e9eaf6] dark:bg-indigo-950/40 rounded-xl text-[#2c308e] dark:text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t(`desktop.features.${key}.title`)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-light mt-1 leading-relaxed">{t(`desktop.features.${key}.description`)}</p>
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
            {t("desktop.warning.text1")} <strong>.jar</strong> {t("desktop.warning.text2")}{' '}
            <strong>adoptium.net</strong> {t("desktop.warning.text3")} <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">java -jar hoodly-desktop.jar</code>.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
