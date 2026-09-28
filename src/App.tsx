import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { navigate, readRoute } from './config/routes'
import { brand, entranceMotion } from './config/brand'
import { EntrancePage } from './pages/EntrancePage'
import { ClayPage } from './pages/ClayPage'
import { TwistPage } from './pages/TwistPage'
import { RevealPage } from './pages/RevealPage'
import { BrandWorksPlaceholderPage } from './pages/BrandWorksPlaceholderPage'
import { kilnCopy } from './config/kiln'
import { canCollect } from './features/kiln/model'
import { shapingCopy } from './config/shaping'
import { revealCopy } from './config/reveal'
import { useWorkshop } from './state/WorkshopProvider'
import { marblingCopy } from './config/marbling'

const VesselPage = lazy(() => import('./pages/VesselPage'))

export function App() {
  const [route, setRoute] = useState(readRoute)
  const { state } = useWorkshop()
  const page = (route === 'twist' || route === 'reveal' || route === 'shape' || route === 'kiln' || route === 'collection') && state.selectedClays.length !== 2 ? 'clay'
    : (route === 'reveal' || route === 'shape' || route === 'kiln' || route === 'collection') && !state.generatedPattern ? 'twist'
    : (route === 'shape' || route === 'kiln' || route === 'collection') && !state.finalPattern ? 'reveal' : (route === 'kiln' || route === 'collection') && !(state.shapeDraft?.progress === 1 && state.shapeDraft.observed) ? 'shape' : route === 'collection' && !(state.kilnDraft && canCollect(state.kilnDraft)) ? 'kiln' : route
  const initial = useRef(true)
  const [entering, setEntering] = useState(false)
  const locked = useRef(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const enterWorkshop = () => {
    if (locked.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('clay')
      return
    }
    locked.current = true
    setEntering(true)
    timers.current = [
      window.setTimeout(() => navigate('clay'), entranceMotion.coveredAt),
      window.setTimeout(() => { setEntering(false); locked.current = false }, entranceMotion.duration),
    ]
  }

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = `${page === 'clay' ? brand.material.title : page === 'twist' ? marblingCopy.step : page === 'reveal' ? revealCopy.step : page === 'shape' ? shapingCopy.step : page === 'kiln' ? kilnCopy.step : page === 'collection' ? kilnCopy.collectionStep : brand.title} · ${brand.subtitle}`
    if (!initial.current) {
      window.scrollTo(0, 0)
      document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    }
    initial.current = false
    if (page !== route) window.location.replace(`#/${page}`)
  }, [page, route])

  return <>
    {page === 'entrance' ? <EntrancePage onEnter={enterWorkshop} entering={entering} /> : page === 'clay' ? <ClayPage /> : page === 'twist' ? <TwistPage /> : page === 'reveal' ? <RevealPage /> : (page === 'shape' || page === 'kiln' || page === 'collection') ? <Suspense fallback={<main className="workshop shape-page"><p role="status">{shapingCopy.loading}</p></main>}><VesselPage phase={page} /></Suspense> : <BrandWorksPlaceholderPage />}
    {entering && <div className="entrance-transition" aria-hidden="true" style={{ animationDuration: `${entranceMotion.duration}ms` }} />}
  </>
}
