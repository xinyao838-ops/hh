export const vesselTypes = [
  {id:'bowl',name:'茶盏',height:.88,radius:1.04,base:.40,outline:'M6 12 Q8 31 20 33 Q32 31 34 12 M6 12 Q20 17 34 12 M6 12 Q20 7 34 12'},
  {id:'cup',name:'杯',height:1.50,radius:.70,base:.58,outline:'M10 8 L12 32 Q20 37 28 32 L30 8 M10 8 Q20 13 30 8 M10 8 Q20 3 30 8'},
  {id:'plate',name:'盘',height:.27,radius:1.32,base:.52,outline:'M3 21 Q9 30 20 30 Q31 30 37 21 M3 21 Q20 27 37 21 M3 21 Q20 15 37 21'},
] as const
export type VesselType=typeof vesselTypes[number]['id']
export const shapingConfig={version:1,segments:80,lowSegments:48,textureSize:1024,lowTextureSize:512,maxDpr:1.75,lowDpr:1.25,liftDistance:.43,rotationThreshold:.16} as const
export const shapingCopy={step:'05 / 塑器',title:'让这一纹，有一个形。',subtitle:'顺着泥，把它慢慢托起来。',lift:'向上托起它。',turn:'转一转，看看你的纹。',formed:'这一纹，有了形。',next:'送它入窑',back:'返回开纹',switch:'左右轻扫，换一个形。',loading:'正在安放你的泥坯。',unavailable:'暂时无法打开立体工作台，请重试或使用支持 WebGL 的浏览器。',retry:'重新打开工作台',canvas:'向上拖动泥坯塑形；左右轻扫选择器型。键盘向上箭头托起，左右箭头选择器型；成形后左右拖动或左右箭头转动观察。',kilnStep:'06 / 入窑',kilnTitle:'让这一纹，静候窑火。',kilnBody:'泥坯已备好，入窑体验将在下一阶段开启。',return:'返回塑器'} as const
