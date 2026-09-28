// Only implemented phases are routable. Future Canvas / 3D steps can be added here.
export type WorkshopRoute = 'entrance' | 'clay' | 'twist' | 'reveal' | 'shape' | 'kiln' | 'collection' | 'brand'

export function readRoute(): WorkshopRoute {
  const route = window.location.hash.slice(2)
  return route === 'clay' || route === 'twist' || route === 'reveal' || route === 'shape' || route === 'kiln' || route === 'collection' || route === 'brand' ? route : 'entrance'
}

export function navigate(route: WorkshopRoute) {
  window.location.hash = route === 'entrance' ? '/' : `/${route}`
}
