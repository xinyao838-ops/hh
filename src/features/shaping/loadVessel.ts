// Only called after the reveal is complete. Importing never creates a WebGL context.
let pending: ReturnType<typeof importVessel> | undefined
const importVessel = () => import('../../pages/VesselPage')
export function loadVessel() {
  if (!pending) pending = importVessel().catch(error => { pending = undefined; throw error })
  return pending
}
export function scheduleVesselPreload() {
  const connection = (navigator as Navigator & {connection?: {saveData?: boolean; effectiveType?: string}}).connection
  if (connection?.saveData || connection?.effectiveType === '2g') return () => {}
  let cancelled = false
  const timer = window.setTimeout(() => {
    if (!cancelled && !document.hidden) void loadVessel().catch(() => {/* Click can retry. */})
  }, 700)
  return () => { cancelled = true; window.clearTimeout(timer) }
}
