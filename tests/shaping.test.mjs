import test from 'node:test'
import assert from 'node:assert/strict'
import {vesselProfile,materialUV,liftProgress,initialShape,normalizeShape} from '../src/features/shaping/model.ts'
import {vesselTypes} from '../src/config/shaping.ts'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,saveShapeDraft,restoreWorkshop} from '../src/state/workshopModel.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {marblingConfig} from '../src/config/marbling.ts'
function state(){let s=toggleClay(toggleClay(createWorkshopState(),'ivory'),'terracotta');const ops=[{kind:'twist'},{kind:'fold'},{kind:'fold'}];s=saveOperations(s,ops,{seed:s.interactionSeed,algorithmVersion:marblingConfig.version,operationCount:ops.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384});return saveFinalPattern(s,createFinalPattern(s))}
test('all vessel profiles begin as the same substantial disc, then develop distinct heights and apertures',()=>{
 const baseline=vesselProfile('bowl',0)
 for(const v of vesselTypes){assert.deepEqual(vesselProfile(v.id,0),baseline);let previous=baseline
 for(let i=1;i<=100;i++){const next=vesselProfile(v.id,i/100);assert.equal(next.length,baseline.length);assert.equal(next[0].r,0);assert.equal(next.at(-1).r,0)
 next.forEach((p,j)=>{assert.ok(Number.isFinite(p.r)&&p.r>=0&&p.y>=0);assert.ok(Math.hypot(p.r-previous[j].r,p.y-previous[j].y)<.03);assert.equal(p.materialRadius,baseline[j].materialRadius)});previous=next}
 const full=vesselProfile(v.id,1);assert.ok(Math.abs(Math.max(...full.map(p=>p.y))-v.height)<.001);assert.ok(full.at(-1).y<v.height);assert.ok(full[31].r>full[40].r)
 }
})
test('material coordinates stay attached during all morphs and wrap with no UV seam',()=>{for(const r of[0,.2,.6,.96]){const a=materialUV(0,r),b=materialUV(Math.PI*2,r);assert.ok(Math.abs(a.u-b.u)<1e-10);assert.ok(Math.abs(a.v-b.v)<1e-10);for(let i=0;i<80;i++){const uv=materialUV(i/80*Math.PI*2,r);assert.ok(uv.u>=0&&uv.u<=1&&uv.v>=0&&uv.v<=1)}}})
test('upward dragging maps continuously to progress and downward dragging can lower unfinished clay',()=>{assert.equal(liftProgress(.2,0,400),.2);assert.ok(liftProgress(.2,-40,400)>.4);assert.equal(liftProgress(0,50,400),0);assert.equal(liftProgress(.5,-300,400),1);assert.ok(liftProgress(.5,30,400)<.5)})
test('shape progress, type and inspection survive refresh with the exact same finalPattern',()=>{const s=state(),final=JSON.stringify(s.finalPattern),draft={...initialShape(s.finalPattern.sourceKey),vesselType:'cup',progress:1,rotation:1.2,observed:true};const saved=saveShapeDraft(s,draft),restored=restoreWorkshop(JSON.stringify(saved));assert.equal(restored.vesselType,'cup');assert.equal(restored.shapeDraft.progress,1);assert.equal(restored.shapeDraft.observed,true);assert.equal(JSON.stringify(restored.finalPattern),final);assert.equal(JSON.stringify(saved.finalPattern),final);assert.equal(saveShapeDraft(s,{...draft,sourceKey:'another'}),s)})
test('old or malformed shape caches cannot unlock the kiln; new clay/gestures invalidate the vessel',()=>{const s=state(),draft=initialShape(s.finalPattern.sourceKey);assert.equal(normalizeShape({...draft,progress:.5,observed:true},draft.sourceKey).observed,false);assert.equal(normalizeShape({...draft,progress:NaN},draft.sourceKey),null);assert.equal(normalizeShape({...draft,vesselType:'teapot'},draft.sourceKey),null);const saved=saveShapeDraft(s,{...draft,progress:1,observed:true});assert.equal(toggleClay(saved,'ivory').shapeDraft,null);assert.equal(saveOperations(saved,[...saved.operationLog,{kind:'twist'}]).shapeDraft,null);assert.equal(restoreWorkshop(JSON.stringify({...saved,shapeDraft:undefined})).shapeDraft,null)})
