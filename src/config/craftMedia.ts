export const craftMedia = {
 kiln: {id:'M12',title:'看看真实窑火',heading:'泥与火，相遇的一刻',video:'/media/craft/m12-kiln.mp4',poster:'/media/craft/m12-kiln.jpg',source:'影像署名：柴战柱 · 企业提供 · 03:01–03:07',description:'真实窑口操作影像。这里仅作动作对照，数字烧制的节奏不代表实际工艺时长或参数。',rights:'用户确认第三方授权：181–187秒、去音轨、保留原画面、公开参赛H5；须署名柴战柱，2026-10-17'},
 twist: {id:'M07',title:'看匠人怎样叠合',heading:'叠起来，再揉进泥里',video:'/media/craft/m07-stack.mp4',poster:'/media/craft/m07-stack.jpg',source:'企业提供 · C0180 · 00:00–00:13',description:'叠合、抬起、揉压，改变泥层的位置。你的手势，也在改变数字泥坯。',rights:'企业许可公开参赛使用；本次用户确认，2026-10-17'},
 reveal: {id:'M04',title:'看看真实切泥',heading:'看一刀怎样分开泥',video:'/media/craft/m04-cut.mp4',poster:'/media/craft/m04-cut.jpg',source:'企业提供 · 授权工艺片段 · 02:42–02:48',description:'这里对照真实分泥动作；数字截面仍由你的揉拉记录计算，不是这段影像的复制。',rights:'用户确认第三方授权：162–168秒、去音轨、公开参赛H5播放；无额外署名或台标保留要求，2026-10-17'},
} as const
export type CraftStage = keyof typeof craftMedia
