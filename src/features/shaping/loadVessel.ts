// Only called after the reveal is complete. Importing never creates a WebGL context.
let pending: ReturnType<typeof importVessel> | undefined
const importVessel = () => {
  performance.mark('vessel-module-request')
  return import('../../pages/VesselPage').then(module => {
    performance.mark('vessel-module-ready')
    return module
  })
}
export function loadVessel() {
  if (!pending) pending = importVessel().catch(error => { pending = undefined; throw error })
  return pending
}
export function scheduleVesselPreload() {
  const connection = (navigator as Navigator & {connection?: {saveData?: boolean; effectiveType?: string}}).connection
  if (connection?.saveData || connection?.effectiveType === '2g') return () => {}
  let cancelled = false
  let idle: number | undefined
  const preload = () => { if (!cancelled && !document.hidden) void loadVessel().catch(() => {/* Click can retry. */}) }
  const timer = window.setTimeout(() => {
    if ('requestIdleCallback' in window) idle = window.requestIdleCallback(preload, {timeout:1200})
    else preload()
  }, 350)
  return () => { cancelled = true; window.clearTimeout(timer); if (idle !== undefined) window.cancelIdleCallback(idle) }
}
