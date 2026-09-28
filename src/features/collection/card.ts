import {collectionConfig,collectionCopy as copy} from '../../config/collection'
import {vesselTypes} from '../../config/shaping'
import type {WorkshopState} from '../../state/workshopModel'
import type {ShapingScene} from '../shaping/scene'
import {drawPatternFace} from '../reveal/render'
import {displayNumber,localDate} from './model'
/** A dedicated print layout; never captures the webpage or substitutes a model. */
export async function createPatternCard(state:WorkshopState,scene:ShapingScene):Promise<Blob>{
 if(!state.finalPattern)throw Error('Missing final pattern')
 await document.fonts.ready
 const c=document.createElement('canvas');c.width=collectionConfig.cardWidth;c.height=collectionConfig.cardHeight
 const ctx=c.getContext('2d')!;ctx.fillStyle='#f1eadd';ctx.fillRect(0,0,c.width,c.height)
 const serif='"Noto Serif SC", "Songti SC", "SimSun", serif'
 const write=(text:string,x:number,y:number,size:number,color='#47362a',align:CanvasTextAlign='left')=>{ctx.font=`${size}px ${serif}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(text,x,y)}
 // A narrow fragment from this exact recipe, subordinate to the vessel.
 ctx.save();ctx.beginPath();ctx.rect(904,80,96,352);ctx.clip();ctx.globalAlpha=.53;drawPatternFace(ctx,state.finalPattern,{x:540,y:-20,width:740,height:640});ctx.restore()
 write(copy.cardBrand,84,125,48);write(copy.cardStudio,87,170,24,'#89745e')
 ctx.strokeStyle='#78614a40';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(84,209);ctx.lineTo(814,209);ctx.stroke()
 ctx.drawImage(scene.capture(940,790),70,215)
 write(copy.cardTitle,540,1000,60,'#47362a','center')
 write(displayNumber(state.experienceId),540,1060,25,'#80664f','center')
 write(`${state.selectedClays.map(c=>c.name).join(' × ')}   /   ${vesselTypes.find(v=>v.id===state.vesselType)?.name??''}`,540,1115,29,'#6e5947','center')
 write(localDate(state.createdAt)+' · '+copy.methodValue,540,1158,21,'#95806b','center')
 ctx.strokeStyle='#78614a40';ctx.beginPath();ctx.moveTo(84,1210);ctx.lineTo(996,1210);ctx.stroke()
 write(copy.cardMotto,540,1270,32,'#514031','center')
 write(copy.cardBrand,540,1332,28,'#79644f','center')
 write('数字体验纹号 · 非品牌产品编号或官方溯源码',540,1374,19,'#a18c76','center')
 return new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'))
}
