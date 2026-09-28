import test from 'node:test'
import assert from 'node:assert/strict'
import {initialKiln,normalizeKiln,advanceKiln,kilnFrame,firingMaterial,openingAmount,canCollect} from '../src/features/kiln/model.ts'
import {initialShape} from '../src/features/shaping/model.ts'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,saveShapeDraft,saveKilnDraft,restoreWorkshop} from '../src/state/workshopModel.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {marblingConfig} from '../src/config/marbling.ts'
const shape={...initialShape('pattern-a'),progress:1,observed:true,rotation:.72}
test('firing changes finish continuously without changing the geometry recipe',()=>{
 const raw=firingMaterial(0),mid=firingMaterial(.5),fired=firingMaterial(1)
 assert.ok(raw.roughness>mid.roughness&&mid.roughness>fired.roughness&&fired.roughness>.25)
 assert.ok(raw.bumpScale>mid.bumpScale&&mid.bumpScale>fired.bumpScale)
 assert.ok(raw.clearcoat<mid.clearcoat&&mid.clearcoat<fired.clearcoat&&fired.clearcoat<.3)
 assert.ok(raw.pigmentMix<mid.pigmentMix&&mid.pigmentMix<fired.pigmentMix)
 for(let i=0;i<=100;i++)assert.ok(firingMaterial(i/100).saturation<=1.1)
})
test('entry, firing and quiet pause reach ready without opening automatically',()=>{
 let k={...initialKiln(shape),phase:'entering'};const phases=new Set()
 for(let i=0;i<210;i++){k=advanceKiln(k,50);phases.add(k.phase);const v=kilnFrame(k);for(const n of Object.values(v))assert.ok(Number.isFinite(n)&&n>=0&&n<=1)}
 assert.deepEqual([...phases],['entering','firing','ready']);assert.equal(k.phase,'ready');assert.equal(kilnFrame(k).firing,1);assert.equal(kilnFrame(k).door,1);assert.equal(canCollect(k),false)
})
test('only an upward door stroke works; opened porcelain waits for time and an actual observation',()=>{
 assert.equal(openingAmount({x:.5,y:.3},{x:.5,y:.8}),0);assert.equal(openingAmount({x:.3,y:.8},{x:.8,y:.75}),0);assert.ok(openingAmount({x:.5,y:.8},{x:.52,y:.4})>.7)
 let k={...initialKiln(shape),phase:'opening',doorStart:.4};for(let i=0;i<90;i++)k=advanceKiln(k,50)
 assert.equal(k.phase,'revealed');assert.equal(kilnFrame(k).door,0);assert.equal(kilnFrame(k).firing,1);assert.equal(canCollect(k),false);assert.equal(canCollect({...k,observed:true}),true)
})
test('kiln state validates its vessel source and rejects bad caches',()=>{
 const raw=initialKiln(shape);assert.deepEqual(normalizeKiln(raw,shape),raw)
 assert.equal(normalizeKiln({...raw,sourceKey:'another'},shape),null);assert.equal(normalizeKiln({...raw,vesselType:'plate'},shape),null);assert.equal(normalizeKiln({...raw,elapsed:NaN},shape),null)
 assert.equal(normalizeKiln({...raw,phase:'ready',observed:true},shape).observed,false);assert.equal(normalizeKiln(raw,{...shape,progress:.8}),null)
})
test('refresh restores firing, orientation and the same finalPattern; reshaping invalidates firing',()=>{
 let s=toggleClay(toggleClay(createWorkshopState(),'ivory'),'terracotta');const ops=[{kind:'fold'},{kind:'twist'},{kind:'fold'}]
 s=saveOperations(s,ops,{seed:s.interactionSeed,algorithmVersion:marblingConfig.version,operationCount:ops.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384});s=saveFinalPattern(s,createFinalPattern(s));s=saveShapeDraft(s,{...initialShape(s.finalPattern.sourceKey),progress:1,observed:true,rotation:.72})
 const k={...initialKiln(s.shapeDraft),phase:'firing',elapsed:3100};s=saveKilnDraft(s,k);const r=restoreWorkshop(JSON.stringify(s));assert.deepEqual(r.kilnDraft,k);assert.deepEqual(r.finalPattern,s.finalPattern);assert.deepEqual(r.shapeDraft,s.shapeDraft)
 assert.equal(saveShapeDraft(s,{...s.shapeDraft,vesselType:'cup',progress:0,observed:false}).kilnDraft,null);assert.equal(toggleClay(s,'ivory').kilnDraft,null)
 assert.equal(restoreWorkshop(JSON.stringify({...s,kilnDraft:undefined})).kilnDraft,null)
})
