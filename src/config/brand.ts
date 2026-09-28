/** Editable creative copy; no brand history or technical craft claims are implied. */
export const brand = {
  name: '金谷轩',
  title: '绞一纹',
  subtitle: '金谷轩数字绞胎工坊',
  workshopName: '数字绞胎工坊',
  description: ['世上没有两道完全相同的绞胎纹。', '今天这一道，由你来做。'],
  entry: '开始制瓷',
  edition: '数字手作体验',
  artworkLabels: ['两色交绞', '一纹一遇'],
  material: {
    title: '02 · 择泥',
    subtitle: '每一道纹，都从一抔泥开始。',
    notice: '择泥体验，即将开启',
    detail: '先在这里停留片刻，下一段制瓷旅程正在准备。',
    back: '返回工坊',
  },
} as const

export const entranceMotion = { duration: 720, coveredAt: 440 } as const

export const palette = {
  clay: '#f3eee5',
  clayLight: '#e8d7b9',
  brown: '#573a29',
  ink: '#30271f',
  muted: '#796c5e',
  fire: '#bd653d',
  line: '#d6cbbb',
} as const

export const workshopSteps = [
  { id: 'entrance', label: '入坊' },
  { id: 'clay', label: '择泥' },
  { id: 'twist', label: '绞胎' },
  { id: 'reveal', label: '开纹' },
  { id: 'shape', label: '塑器' },
  { id: 'fire', label: '入窑' },
  { id: 'unveil', label: '开窑' },
  { id: 'keepsake', label: '藏纹' },
] as const
