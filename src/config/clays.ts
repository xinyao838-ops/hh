/** Digital palette studies only; replace with verified brand materials later. */
export const clayMaterials = [
  { id: 'ivory', name: '胎白', color: '#dfcfb3', description: '温润的米白色，数字体验视觉占位配色。', shape: 'M19 34C24 16 48 13 69 19C90 17 105 31 108 51C115 71 104 94 84 98C60 109 32 101 18 89C5 76 9 49 19 34Z' },
  { id: 'umber', name: '焦褐', color: '#785039', description: '沉静的焦褐色，数字体验视觉占位配色。', shape: 'M12 44C15 25 30 20 49 17C70 10 100 24 104 40C116 55 106 84 93 94C76 108 51 105 35 98C14 95 7 66 12 44Z' },
  { id: 'ink', name: '墨黑', color: '#37332e', description: '深沉的墨黑色，数字体验视觉占位配色。', shape: 'M16 36C27 19 44 22 59 16C82 11 106 29 107 50C108 69 114 82 94 96C73 107 54 100 35 99C16 94 6 75 12 54Z' },
  { id: 'terracotta', name: '赤陶', color: '#ad6647', description: '暖调的赤陶色，数字体验视觉占位配色。', shape: 'M16 40C18 23 43 15 61 18C82 14 101 28 108 46C116 65 104 83 91 97C71 110 52 99 34 97C13 92 7 72 16 40Z' },
] as const
export type ClayId = typeof clayMaterials[number]['id']
export type SelectedClay = { id: ClayId; name: string; color: string; description: string }
export const clayCopy = {
  step: '02 / 择泥', title: '先选两种泥', intro: '不同的泥色相互交绞，才有了独一无二的纹。',
  table: '制泥台', count: '已备', slots: ['第一色', '第二色'],
  initial: '轻触两块泥，放入制泥台。', first: '第一色已入泥。', ready: '两泥已备，可以起绞。',
  full: '制泥台已有两种泥，请先取消一种。', next: '开始绞胎',
  nextPhase: '两种泥色已备好，绞胎体验将在下一阶段开启。',
  hint: '再次轻触已选泥团，可将它移出。', disclaimer: '数字体验配色示意，非品牌实际生产泥料。',
  changeWarning: '更换泥色后，会重新起绞。',
  back: '返回入坊', remove: '移出', selected: '已入台',
} as const
