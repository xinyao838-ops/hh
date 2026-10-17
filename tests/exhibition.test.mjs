import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {craftMedia} from '../src/config/craftMedia.ts'
import {exhibitionImages} from '../src/config/exhibition.ts'
test('editorial images are local, documented and separate from generated state',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/media/manifest.json','utf8'))
 for(const item of Object.values(exhibitionImages)){
  assert.ok(manifest.some(asset=>asset.file===item.src))
  assert.ok(fs.statSync('public'+item.src).size<500000)
  assert.ok(item.alt.length>5)
 }
 assert.ok(!JSON.stringify(manifest).match(/[A-Z]:[\\/]/))
 const home=fs.readFileSync('src/pages/EntrancePage.tsx','utf8')
 assert.ok(!home.includes('<video'))
 assert.ok(home.includes('<ClaySectionArtwork />'))
})

test('craft reference stays read-only and retains an image when playback fails',()=>{
 const source=fs.readFileSync('src/components/CraftReference.tsx','utf8')
 assert.ok(!source.includes('useWorkshop'))
 assert.ok(source.includes('className="craft-fallback"'))
 assert.ok(source.includes('src={playing?item.video:undefined}'))
 assert.ok(source.includes('preload="none"'))
 assert.ok(source.includes('v.pause();v.removeAttribute'))
})

test('every shipped craft asset has a local manifest record and explicit M12 credit',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/media/manifest.json','utf8'))
 for(const item of Object.values(craftMedia)){
  for(const file of [item.video,item.poster]){
   const record=manifest.find(asset=>asset.file===file)
   assert.ok(record,file)
   assert.ok(fs.statSync('public'+file).size<2000000)
   assert.equal(record.audio,false)
   if(item.id==='M12')assert.equal(record.credit,'柴战柱')
  }
  if(item.id==='M12'){assert.ok(item.source.includes('柴战柱'));assert.equal(item.credit,'柴战柱')}
 }
 const gallery=fs.readFileSync('src/components/RealWorksGallery.tsx','utf8')
 assert.ok(!gallery.includes('企业提供影像'))
 assert.ok(gallery.includes('loading="lazy"'))
 assert.ok(!gallery.includes('useWorkshop'))
})

test('work cover previews are genuine self-contained image fallbacks and hints are exclusive',()=>{
 const view=fs.readFileSync('src/components/WorkImage.tsx','utf8')
 assert.ok(view.includes("onError={()=>setStatus('failed')}"))
 assert.ok(view.includes('work-image-preview'))
 assert.ok(view.includes('重新加载'))
 const vessel=fs.readFileSync('src/pages/VesselPage.tsx','utf8')
 assert.ok(!vessel.includes('className={`shape-formed'))
 assert.ok(vessel.includes('shape.message?shapeCopy.formed:shapeCopy.turn'))
})

