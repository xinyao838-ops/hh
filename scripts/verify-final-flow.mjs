import {pathToFileURL} from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
// Supply an existing Playwright installation. This script installs nothing.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright')
const out=path.resolve(process.env.REVEAL_OUTPUT||'artifacts/reveal-flow')
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})
const page=await context.newPage(),errors=[],checks=[],events=[]
page.on('pageerror',e=>errors.push(e.message))
const base=process.env.H5_URL||'http://127.0.0.1:5173'
const key='jiaoyiwen.workshop.v1'
const wait=ms=>page.waitForTimeout(ms)
const check=(value,name)=>{assert.ok(value,name);checks.push(name)}
const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)
const phase=()=>page.locator('.reveal-canvas').getAttribute('data-phase')
const until=async p=>{const start=Date.now();while(!await p()){if(Date.now()-start>12000)throw Error('state timeout');await wait(30)}}
const client=await context.newCDPSession(page)
async function stroke(selector,from,to,{hold=0,cancel=false,steps=18}={}){
 const r=await page.locator(selector).boundingBox()
 const point=p=>({x:r.x+p[0]*r.width,y:r.y+p[1]*r.height,radiusX:5,radiusY:5,force:.65,id:1})
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(from)]})
 if(hold)await wait(hold)
 for(let i=1;i<=steps;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point([from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps])]});await wait(22)}
 await client.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await wait(90)
}
async function tap(selector){const r=await page.locator(selector).boundingBox();await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2)}
await page.goto(base+'/#/')
// Recording-only pointer overlay, never included in shipped product code.
await page.evaluate(()=>{
 const dot=document.createElement('div');dot.id='recording-touch';dot.style.cssText='position:fixed;width:28px;height:28px;margin:-14px;border:2px solid #a66035;border-radius:50%;background:#c58a5540;pointer-events:none;z-index:99999;display:none';document.body.append(dot)
 const move=e=>{dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px'}
 document.addEventListener('pointerdown',e=>{move(e);dot.style.display='block'},true)
 document.addEventListener('pointermove',move,true)
 for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>{dot.style.display='none'},true)
})
const frames=path.join(out,'frames');await fs.mkdir(frames,{recursive:true});const records=[],writes=[];let recording=true
client.on('Page.screencastFrame',e=>{if(recording){const name=`frame-${String(records.length).padStart(5,'0')}.jpg`;records.push({name,time:e.metadata.timestamp});writes.push(fs.writeFile(path.join(frames,name),Buffer.from(e.data,'base64')))}void client.send('Page.screencastFrameAck',{sessionId:e.sessionId})})
await client.send('Page.startScreencast',{format:'jpeg',quality:95,maxWidth:390,maxHeight:844,everyNthFrame:1})
const started=Date.now(),mark=name=>events.push({name,seconds:(Date.now()-started)/1000})
await wait(700);mark('01开始制瓷');await page.getByRole('button',{name:/开始制瓷/}).click();await page.locator('.start-twisting').waitFor();
await page.getByRole('button',{name:'胎白',exact:true}).click();await page.getByRole('button',{name:'焦褐',exact:true}).click()
await page.locator('.start-twisting').click();await page.locator('.twist-canvas').waitFor();await wait(800)

mark('03真实触控揉拉')
for(let i=0;i<3;i++){
 await stroke('.twist-canvas',[.48,.49],[.65,.57]);await stroke('.twist-canvas',[.56,.52],[.34,.43])
}
mark('长按压合');await stroke('.twist-canvas',[.5,.5],[.5,.5],{hold:650,steps:1});await wait(350)
mark('折合、轻绞')
for(let i=0;i<2;i++){await tap('.craft-actions button:last-child');await wait(600);await tap('.craft-actions button:first-child');await wait(600)}
const beforeUndo=(await state()).operationLog.length
await tap('.history-actions button:first-child');await wait(100);check((await state()).operationLog.length<beforeUndo,'撤销减少当前日志')
await tap('.history-actions button:last-child');await wait(100);check((await state()).operationLog.length===beforeUndo,'重做恢复日志')
check((await state()).operationLog.some(o=>o.kind==='press'),'实际长按产生press日志')
await page.screenshot({path:path.join(out,'03揉拉后.png')})
const claySaved=JSON.stringify(await state())
await tap('.craft-reference');await page.locator('.craft-dialog').waitFor()
check(await page.locator('.craft-dialog video').getAttribute('src')===null,'03影像未播放前不加载视频')
await page.screenshot({path:path.join(out,'03真实工艺对照.png')})
await tap('.craft-play');await wait(1300)
check(await page.locator('.craft-dialog video').evaluate(v=>v.currentTime>0),'M07用户主动播放')
await tap('.craft-return');check(JSON.stringify(await state())===claySaved,'03对照关闭不修改制作数据')
mark('主动点击进入04');await tap('.twist-footer button')
await page.locator('.reveal-canvas').waitFor()
check((await page.locator('.clay-page-header').innerText()).includes('04'),'切割前页面已经显示04')
await until(async()=>await phase()==='uncut');await wait(650)
check(!(await state()).finalPattern,'进入04没有自动保存finalPattern')
const recordingSource=await state()
const expected=await page.locator('.reveal-canvas').getAttribute('data-source-key')
await page.screenshot({path:path.join(out,'04等待划切.png')})
mark('错误上划，不触发');await stroke('.reveal-canvas',[.55,.77],[.55,.26]);check(await phase()==='uncut','真实上划不触发')
await wait(600);mark('短划，不触发');await stroke('.reveal-canvas',[.55,.36],[.55,.44]);check(await phase()==='uncut','真实短划不触发')
mark('主动有效向下划切');await stroke('.reveal-canvas',[.58,.26],[.59,.78]);check(await phase()==='cutting','真实向下划切触发')
await until(async()=>await phase()==='revealed');check(!(await page.locator('.reveal-words').innerText()).trim(),'切面完整时暂不显示文字')
check((await state()).finalPattern.sourceKey===expected,'生成结果与切前sourceKey一致')
await wait(1500);await page.screenshot({path:path.join(out,'04同源截面.png')})
const revealSaved=JSON.stringify(await state())
await tap('.craft-reference');await page.locator('.craft-dialog').waitFor()
await page.screenshot({path:path.join(out,'04真实工艺对照.png')})
await tap('.craft-play');await wait(1000)
check(await page.locator('.craft-dialog video').evaluate(v=>v.currentTime>0),'M04授权片段主动播放')
await tap('.craft-return');check(JSON.stringify(await state())===revealSaved,'04对照不改写finalPattern')
mark('进入05塑器');await tap('.reveal-footer button');await page.locator('.shape-canvas').waitFor();await wait(1800)
check(await page.locator('.shape-page').getAttribute('data-pattern-key')===expected,'05使用同一finalPattern')
check(await page.locator('.shape-error').count()===0,'05 WebGL正常建立')
await page.screenshot({path:path.join(out,'05同源塑器.png')});await wait(300)
async function form(type){
 const canvas=page.locator('.shape-canvas')
 const bounds=JSON.parse(await canvas.getAttribute('data-bounds')),y=(bounds.top+bounds.bottom)/2
 await stroke('.shape-canvas',[.5,y],[.5,y-.25],{steps:15})
 const partial=Number(await canvas.getAttribute('data-progress'));check(partial>0&&partial<1,type+'托举有中间形态')
 const current=JSON.parse(await canvas.getAttribute('data-bounds')),mid=(current.top+current.bottom)/2
 await stroke('.shape-canvas',[.5,mid],[.5,mid-.32],{steps:22});await wait(350)
 check(await canvas.getAttribute('data-progress')==='1',type+'真实托举形成器型')
 const shaped=JSON.parse(await canvas.getAttribute('data-bounds')),yy=(shaped.top+shaped.bottom)/2
 await stroke('.shape-canvas',[.5,yy],[.73,yy],{steps:18});await wait(900)
 check(await canvas.getAttribute('data-observed')==='true',type+'旋转观察后可入窑')
 check((await state()).finalPattern.sourceKey===expected,type+'同源纹样保持')
 await page.screenshot({path:path.join(out,'05-'+type+'成形.png')})
}
mark('05分两次向上托举并旋转');await form('茶盏');await wait(600)
for(const type of ['杯','盘']){mark('切换并托起'+type);await page.locator('.vessel-names button').nth(type==='杯'?1:2).click();await wait(650);await form(type)}
const sceneId=await page.locator('.shape-canvas').getAttribute('data-scene-id')
mark('完成塑形，进入06入窑');await tap('.shape-footer button');await page.locator('.kiln-page').waitFor();await wait(1000)
check(await page.locator('.shape-canvas').getAttribute('data-scene-id')===sceneId,'05→06复用同一个Three.js场景')
await page.screenshot({path:path.join(out,'06同一器物入窑前.png')})

const cards=[]
async function fireAndCollect(type){
 mark('06送入窑炉-'+type);await tap('.kiln-footer button');await until(async()=>await page.locator('.shape-canvas').getAttribute('data-kiln-phase')==='ready')
 mark('06主动开窑-'+type);await stroke('.shape-canvas',[.5,.82],[.5,.42],{steps:24});await until(async()=>await page.locator('.shape-canvas').getAttribute('data-kiln-phase')==='revealed');await wait(1600)
 const bounds=JSON.parse(await page.locator('.shape-canvas').getAttribute('data-bounds')),yy=(bounds.top+bounds.bottom)/2
 await stroke('.shape-canvas',[.5,yy],[.72,yy]);await wait(1300)
 await page.screenshot({path:path.join(out,'06-'+type+'烧成.png')})
 if(type==='盘'){
  const before=JSON.stringify(await state());await tap('.craft-reference');await tap('.craft-play');await wait(1100)
  check(await page.locator('.craft-dialog video').evaluate(v=>v.currentTime>0),'M12可由用户主动播放')
  check((await page.locator('.craft-dialog').innerText()).includes('柴战柱'),'M12保留署名')
  await page.screenshot({path:path.join(out,'06真实窑火对照.png')});await tap('.craft-return');check(JSON.stringify(await state())===before,'M12不改写作品')
 }
 mark('07藏纹-'+type);await tap('.kiln-footer button');await page.locator('.collection-page').waitFor();await wait(500)
 check((await state()).finalPattern.sourceKey===expected,type+'藏纹同源')
 await page.screenshot({path:path.join(out,'07-'+type+'正式界面.png'),fullPage:true})
 await page.locator('.generate-card').click();await page.locator('.card-preview img').waitFor();await until(async()=>await page.locator('.card-preview img').evaluate(i=>i.naturalWidth===1080&&i.naturalHeight===1440))
 const download=page.waitForEvent('download');await page.locator('.save-card').click();const file=await download;await file.saveAs(path.join(out,type+'-1080x1440.png'))
 check(true,type+'真实PNG下载1080×1440');cards.push({type,state:await state(),filename:file.suggestedFilename()})
}
await fireAndCollect('盘');mark('全流程结束')
await client.send('Page.stopScreencast');recording=false;await Promise.all(writes)
let list='ffconcat version 1.0\n';for(let i=0;i<records.length;i++)list+=`file '${records[i].name}'\nduration ${i+1<records.length?Math.max(.001,records[i+1].time-records[i].time):1}\n`;list+=`file '${records.at(-1).name}'\n`;await fs.writeFile(path.join(frames,'frames.txt'),list)
for(const [type,index] of [['茶盏',0],['杯',1]]){
 await page.evaluate(()=>scrollTo(0,0));await tap('.clay-back');await page.locator('.kiln-page').waitFor();await tap('.clay-back');await page.locator('.shape-page:not(.kiln-page)').waitFor()
 await page.locator('.vessel-names button').nth(index).click();await wait(650);await form(type);await tap('.shape-footer button');await page.locator('.kiln-page').waitFor();await fireAndCollect(type)
}
await page.evaluate(()=>scrollTo(0,0))
for(const [w,h]of [[375,812],[390,844],[430,932]]){await page.setViewportSize({width:w,height:h});await wait(200);check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${w}×${h} 藏纹无横向溢出`);await page.screenshot({path:path.join(out,`07-${w}.png`)})}
await page.locator('.brand-invitation button').click();await page.locator('.brand-placeholder img').waitFor();check(await page.locator('.brand-placeholder img').evaluate(i=>i.complete&&i.naturalWidth>0),'已授权真实作品照片加载');check(await page.locator('a[href^="http"]').count()===0,'无未经确认外部产品链接')
check(errors.length===0,'全流程无pageerror')
await fs.writeFile(path.join(out,'验证记录.json'),JSON.stringify({checks,errors,events,frames:records.length,recordingSource,recordingSourceKey:expected,cards,recording:'正式dist；Edge CDP触控；非真机'},null,2));await browser.close();console.log(JSON.stringify({checks,errors,out},null,2))
