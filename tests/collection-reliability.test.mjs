import test from 'node:test'
import assert from 'node:assert/strict'
import {captureForCard} from '../src/features/collection/capture.ts'
import {CollectionRotation} from '../src/features/collection/rotation.ts'

test('card captures before fonts resolve, preserving the clicked angle after scene disposal',async()=>{
 let angle=.4,disposed=false,resolve
 const fonts=new Promise(r=>resolve=r)
 const result=captureForCard(()=>{assert.equal(disposed,false);return {angle}},fonts)
 angle=2;disposed=true;resolve()
 assert.deepEqual(await result,{angle:.4})
})
test('stalled/rejected fonts fall back; capture failures reject rather than export a blank',async()=>{
 assert.equal(await captureForCard(()=>7,new Promise(()=>{}),5),7)
 assert.equal(await captureForCard(()=>9,Promise.reject(Error('fonts')),5),9)
 await assert.rejects(captureForCard(()=>{throw Error('context lost')},Promise.resolve()),/context lost/)
})
test('cancel/lost capture retain angle and do not coast; next contact can rotate',()=>{
 const r=new CollectionRotation(.4)
 assert.equal(r.begin(1,100,true,0),true)
 assert.equal(r.begin(2,110,false,0),false)
 assert.equal(r.move(2,200,10),false)
 r.move(1,120,10);const angle=r.angle
 assert.equal(r.end(2,true,20),false)
 r.end(1,true,20);assert.equal(r.velocity,0);r.tick();assert.equal(r.angle,angle)
 assert.equal(r.begin(3,100,true,0),true)
 r.move(3,130,30);r.end(3,false,35);assert.ok(r.velocity>0)
 r.stop();const stopped=r.angle;r.tick();assert.equal(r.angle,stopped)
})
test('holding after a swipe produces no stale fling; regular inertia settles',()=>{
 const r=new CollectionRotation(0);r.begin(1,0,true,0);r.move(1,10,10);r.end(1,false,200);assert.equal(r.velocity,0)
 r.begin(2,0,true,0);r.move(2,10,210);r.end(2,false,220)
 let frames=0;while(r.tick()&&frames<200)frames++
 assert.ok(frames>0&&frames<200);assert.ok(Number.isFinite(r.angle))
})
