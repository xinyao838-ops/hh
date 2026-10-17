import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
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
 assert.ok(home.includes('fetchPriority="high"'))
})

test('craft reference stays read-only and retains an image when playback fails',()=>{
 const source=fs.readFileSync('src/components/CraftReference.tsx','utf8')
 assert.ok(!source.includes('useWorkshop'))
 assert.ok(source.includes('className="craft-fallback"'))
 assert.ok(source.includes('src={playing?item.video:undefined}'))
 assert.ok(source.includes('preload="none"'))
 assert.ok(source.includes('v.pause();v.removeAttribute'))
})
