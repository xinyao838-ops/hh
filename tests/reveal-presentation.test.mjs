import test from 'node:test'
import assert from 'node:assert/strict'
import {RevealPresentation,cutPresentation} from '../src/features/reveal/presentation.ts'
import {revealConfig} from '../src/config/reveal.ts'

test('04 entry never cuts automatically; only one explicit cut can start',()=>{
 const t=new RevealPresentation()
 assert.equal(t.cut(),false)
 t.advance(0);t.advance(650)
 assert.equal(t.phase,'uncut');t.advance(10000)
 assert.equal(t.progress,0);assert.equal(t.cut(),true);assert.equal(t.cut(),false)
 t.advance(10000);assert.equal(t.advance(11900),true)
 assert.equal(t.phase,'revealed');assert.equal(t.elapsed,0)
 assert.equal(t.advance(13000),false);assert.equal(t.cut(),false)
})
test('hidden time does not finish the cut or consume the wordless pause',()=>{
 const t=new RevealPresentation(false);t.advance(0);t.advance(650);t.cut()
 t.advance(1000);t.advance(1400);assert.equal(t.elapsed,400)
 t.advance(2000,false);t.advance(200000,false);t.advance(201000)
 assert.equal(t.elapsed,400)
 t.advance(202500);assert.equal(t.phase,'revealed');assert.equal(t.elapsed,0)
 t.advance(202700);t.pause();t.advance(302000)
 assert.equal(t.elapsed,200)
 t.advance(302400);assert.equal(t.elapsed,revealConfig.firstLineDelay)
})
test('reduced motion still waits for deliberate action; restored result stays open',()=>{
 const t=new RevealPresentation(true)
 assert.equal(t.phase,'uncut');t.advance(10000);assert.equal(t.progress,0)
 t.cut();t.advance(10000);t.advance(10180);assert.equal(t.phase,'revealed')
 const restored=new RevealPresentation(false,true)
 assert.equal(restored.progress,1);assert.equal(restored.cut(),false)
 assert.equal(restored.elapsed,revealConfig.invitationDelay)
})
test('cut rhythm is bounded, monotonic, and separation precedes face turning',()=>{
 let last=cutPresentation(0)
 for(let i=1;i<=100;i++){
  const next=cutPresentation(i/100)
  for(const key of Object.keys(next)){assert.ok(next[key]>=last[key]);assert.ok(next[key]<=1)}
  last=next
 }
 assert.deepEqual(cutPresentation(-1),{crack:0,separation:0,turn:0,clarity:0})
 assert.deepEqual(cutPresentation(2),{crack:1,separation:1,turn:1,clarity:1})
 assert.equal(cutPresentation(850/1900).separation,1)
 assert.equal(cutPresentation(850/1900).turn,0)
})
