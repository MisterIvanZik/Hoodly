import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { zonesApi } from '../services/api/zone'
import type { Zone } from '../types/zone.types'

interface ZoneMapProps {
  onZoneSelect: (zone: Zone) => void
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566]
const DEFAULT_ZOOM = 12

function getPolygonCenter(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0]
  let lngSum = 0
  let latSum = 0
  for (const [lng, lat] of ring) {
    lngSum += lng
    latSum += lat
  }
  return [lngSum / ring.length, latSum / ring.length]
}

function ZoneMap({ onZoneSelect }: ZoneMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const [loading, setLoading] = useState(true)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressInput, setAddressInput] = useState('')
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  const onZoneSelectRef = useRef(onZoneSelect)
  useEffect(() => {
    onZoneSelectRef.current = onZoneSelect
  }, [onZoneSelect])

  const recenterOnUser = useCallback(() => {
    if (userPosition && map.current) {
      map.current.flyTo({
        center: userPosition,
        zoom: DEFAULT_ZOOM,
        duration: 1500,
      })
    }
  }, [userPosition])

  // Placer ou mettre à jour le marqueur utilisateur
  const placeUserMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return

    // Supprimer l'ancien marqueur s'il existe
    userMarker.current?.remove()

    const markerEl = document.createElement('div')
    markerEl.style.width = '20px'
    markerEl.style.height = '20px'
    markerEl.style.background = '#3b82f6'
    markerEl.style.border = '3px solid white'
    markerEl.style.borderRadius = '50%'
    markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'

    userMarker.current = new mapboxgl.Marker(markerEl)
      .setLngLat([lng, lat])
      .addTo(map.current)
  }, [])

  // Rechercher une adresse via MapBox Geocoding
  const searchAddress = async () => {
    if (!addressInput.trim()) return

    setAddressError(null)
    setAddressLoading(true)

    try {
      const query = encodeURIComponent(addressInput.trim())
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
      )

      if (!response.ok) throw new Error('Erreur de recherche')

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        setAddressError('Adresse introuvable. Essayez une autre recherche.')
        return
      }

      const [lng, lat] = data.features[0].center
      setUserPosition([lng, lat])
      setShowAddressForm(false)
      setAddressInput('')

      if (map.current) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: DEFAULT_ZOOM,
          duration: 1500,
        })
        placeUserMarker(lng, lat)
      }
    } catch {
      setAddressError('Erreur lors de la recherche. Réessayez.')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchAddress()
  }

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const initMap = (lng: number, lat: number) => {
      if (map.current) return

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: DEFAULT_ZOOM,
      })

      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
        }),
        'top-right',
      )

      map.current.on('load', async () => {
        // Bâtiments 3D
        const layers = map.current!.getStyle().layers
        const labelLayerId = layers.find(
          (l) => l.type === 'symbol' && l.layout?.['text-field'],
        )?.id

        map.current!.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 12,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6,
            },
          },
          labelLayerId,
        )

        try {
          const { data } = await zonesApi.getAll(1, 100)
          const zones = data.zones ?? []

          console.log(`${zones.length} quartier(s) chargé(s)`)

          zones.forEach((zone: Zone) => {
            if (zone.polygone && map.current) {
              map.current!.addSource(`zone-${zone.id}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: zone.polygone.coordinates,
                  },
                  properties: { name: zone.nom, ville: zone.ville },
                },
              })

              map.current!.addLayer({
                id: `zone-fill-${zone.id}`,
                type: 'fill',
                source: `zone-${zone.id}`,
                paint: {
                  'fill-color': '#3b82f6',
                  'fill-opacity': 0.3,
                },
              })

              map.current!.addLayer({
                id: `zone-border-${zone.id}`,
                type: 'line',
                source: `zone-${zone.id}`,
                paint: {
                  'line-color': '#3b82f6',
                  'line-width': 2,
                },
              })

              const center = getPolygonCenter(zone.polygone.coordinates)

              map.current!.addSource(`zone-center-${zone.id}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: center,
                  },
                  properties: { name: zone.nom },
                },
              })

              map.current!.addLayer({
                id: `zone-label-${zone.id}`,
                type: 'symbol',
                source: `zone-center-${zone.id}`,
                layout: {
                  'text-field': zone.nom,
                  'text-size': 14,
                  'text-anchor': 'center',
                },
                paint: {
                  'text-color': '#1e40af',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2,
                },
              })

              map.current!.on('click', `zone-fill-${zone.id}`, () => {
                onZoneSelectRef.current(zone)
              })

              map.current!.on('mouseenter', `zone-fill-${zone.id}`, () => {
                map.current!.getCanvas().style.cursor = 'pointer'
              })
              map.current!.on('mouseleave', `zone-fill-${zone.id}`, () => {
                map.current!.getCanvas().style.cursor = ''
              })
            }
          })
        } catch (err) {
          console.error('Erreur chargement zones:', err)
        }

        setLoading(false)
      })
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        console.log('Géoloc réussie:', { lat, lng })
        setUserPosition([lng, lat])
        initMap(lng, lat)
      },
      (err) => {
        console.warn('Géoloc refusée/erreur:', err.message)
        setShowAddressForm(true)
        initMap(DEFAULT_CENTER[0], DEFAULT_CENTER[1])
      },
    )

    return () => {
      userMarker.current?.remove()
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-lg border border-gray-200">
      <div ref={mapContainer} className="h-full w-full" />

      {userPosition && (
        <button
          onClick={recenterOnUser}
          className="absolute bottom-4 right-4 z-10 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-lg transition-colors hover:bg-gray-100"
        >
          📍 Me recentrer
        </button>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Chargement de la carte...</p>
        </div>
      )}

      {showAddressForm && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium text-gray-700">
            📍 Entrez votre adresse pour centrer la carte
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder="Ex: 12 rue de Belleville, Paris"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={searchAddress}
              disabled={addressLoading || !addressInput.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addressLoading ? '...' : 'Rechercher'}
            </button>
          </div>
          {addressError && (
            <p className="mt-2 text-xs text-red-500">{addressError}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ZoneMap
