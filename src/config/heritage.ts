import {pptWorks} from './pptWorks.ts'
/** Fill only from supplied, verified materials; never infer brand craft facts. */
export interface HeritageItem {
 id:string
 title:string
 width?:number
 height?:number
 kind:'image'|'video'
 src:string
 alt:string
 caption:string
 source:string
 authorization:string
 factChecked:boolean
 publication:'placeholder'|'cleared'
}
export const heritageContent:HeritageItem[]=[{id:'jgx-ppt38',title:'金谷轩 · 器物影像',kind:'image',src:'/media/works/jgx-ppt38.jpg',alt:'金谷轩器物照片',caption:'真实作品影像，与这一纹的数字体验相互对照。具体产品名称与价格暂不标注。',source:'企业提供《金谷轩绞胎瓷(1)》第38页',authorization:'用户2026-10-17明确许可用于07真实作品展示，不标产品名或价格',factChecked:true,publication:'cleared'}]
heritageContent.push(
 {id:'m01-vessel',title:'孔雀开屏',kind:'image',src:'/media/works/m01-cover.webp',alt:'企业作品孔雀开屏的双耳器物全貌',caption:'企业实拍作品 · 名称沿用企业提供片名，非本次数字生成器物。',source:'企业提供 M01《孔雀开屏》00:09.60静帧',authorization:'用户许可企业素材公开参赛使用',factChecked:true,publication:'cleared'},
 {id:'m02-vessel',title:'丝绸之路',kind:'image',src:'/media/works/m02-cover.webp',alt:'企业作品丝绸之路的彩色层纹器物',caption:'企业实拍作品 · 名称沿用企业提供片名，非本次数字生成器物。',source:'企业提供 M02《丝绸之路》00:02.17静帧',authorization:'用户许可企业素材公开参赛使用',factChecked:true,publication:'cleared'},
)

heritageContent.push(...pptWorks)

export function publishableHeritage(items:HeritageItem[]){
 return items.filter(item=>item.publication==='cleared'&&item.factChecked
  &&item.source.trim()&&item.authorization.trim()&&item.alt.trim()
  &&/^\/media\/[a-zA-Z0-9/_\-.]+$/.test(item.src)&&!item.src.includes('..')
  &&['image','video'].includes(item.kind))
}

