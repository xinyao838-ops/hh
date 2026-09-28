import { useId } from 'react'
import { clayMaterials, type SelectedClay } from '../config/clays'
export function ClayLump({ clay }: { clay: SelectedClay }) {
  const id = useId().replace(/:/g, '')
  const shape = clayMaterials.find(item => item.id === clay.id)!.shape
  return <svg className="clay-lump" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${id}-light`} cx="32%" cy="23%" r="82%"><stop stopColor="white" stopOpacity=".25" /><stop offset=".48" stopColor="white" stopOpacity="0" /><stop offset="1" stopColor="#160f09" stopOpacity=".32" /></radialGradient>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <clipPath id={`${id}-clip`}><path d={shape} /></clipPath>
    </defs>
    <path d={shape} fill="#30271f" opacity=".18" transform="translate(0 3)" />
    <path d={shape} fill={clay.color} /><path d={shape} fill={`url(#${id}-light)`} />
    <g clipPath={`url(#${id}-clip)`}>
      <path d="M24 36Q49 20 74 28M18 63Q23 72 31 77M77 87Q91 78 96 63" fill="none" stroke="#fff3df" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round" />
      <path d="M41 37q10-4 20 0M33 87q12 4 20 1M86 44q5 5 3 12" fill="none" stroke="#24170e" strokeOpacity=".1" strokeWidth="1.5" strokeLinecap="round" />
      <rect width="120" height="120" filter={`url(#${id}-grain)`} opacity=".2" style={{ mixBlendMode: 'soft-light' }} />
    </g>
  </svg>
}
