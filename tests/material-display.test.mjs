import test from 'node:test'
import assert from 'node:assert/strict'
import {traceMaterialBoundary} from '../src/features/marbling/displayPath.ts'
import {experimentSamples,experimentSeed} from './fixtures/material-experiments.ts'
import {replay,modelFingerprint} from '../src/features/marbling/engine.ts'
const recorder=()=>{const calls=[];return {calls,moveTo:(...a)=>calls.push(['move',...a]),lineTo:(...a)=>calls.push(['line',...a]),quadraticCurveTo:(...a)=>calls.push(['quad',...a]),closePath:()=>calls.push(['close'])}}
test('display corner smoothing is opt-in, convex, deterministic and does not mutate material points',()=>{
 const points=[{x:0,y:0},{x:1,y:3},{x:2,y:0},{x:2,y:5},{x:0,y:5}],copy=structuredClone(points)
 const legacy=recorder();traceMaterialBoundary(legacy,points)
 assert.deepEqual(legacy.calls,[['move',0,0],['line',1,3],['line',2,0],['line',2,5],['line',0,5],['close']])
 const smooth=recorder();traceMaterialBoundary(smooth,points,true)
 assert.equal(smooth.calls.filter(c=>c[0]==='quad').length,points.length)
 for(let i=0;i<points.length;i++){
  const c=smooth.calls[i+1],n=points[(i+1)%points.length]
  assert.deepEqual(c,['quad',points[i].x,points[i].y,(points[i].x+n.x)/2,(points[i].y+n.y)/2])
 }
 const again=recorder();traceMaterialBoundary(again,points,true);assert.deepEqual(smooth.calls,again.calls);assert.deepEqual(points,copy)
})
test('balanced logs have stable increasing layers and sequence-dependent geometry',()=>{
 const models=experimentSamples.map(s=>replay(experimentSeed,s.operations))
 assert.ok(models[1].layers.length<models[2].layers.length)
 assert.ok(models[2].layers.length<=models[3].layers.length)
 for(let i=0;i<models.length;i++){assert.deepEqual(models[i],replay(experimentSeed,experimentSamples[i].operations));assert.equal(models[i].columns.length,57)}
 assert.notEqual(modelFingerprint(models[3]),modelFingerprint(models[4]))
})
import {drawPatternFace} from '../src/features/reveal/render.ts'
import {createFinalPattern} from '../src/features/reveal/pattern.ts'
import {createWorkshopState,toggleClay,saveOperations,saveFinalPattern,restoreWorkshop} from '../src/state/workshopModel.ts'
import {marblingConfig} from '../src/config/marbling.ts'
test('display modes retain source geometry, colors, sourceKey and refresh lineage',()=>{
 for(const sample of experimentSamples.slice(1)){
  let state=toggleClay(toggleClay(createWorkshopState(),'ivory'),'umber')
  state=saveOperations({...state,interactionSeed:experimentSeed},sample.operations,{seed:experimentSeed,algorithmVersion:marblingConfig.version,operationCount:sample.operations.length,imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384})
  const recipe=createFinalPattern(state);assert.ok(recipe)
  const before=structuredClone(recipe),originalPath=globalThis.Path2D
  try{
   globalThis.Path2D=class {calls=[];moveTo(...a){this.calls.push(['m',...a])}lineTo(...a){this.calls.push(['l',...a])}quadraticCurveTo(...a){this.calls.push(['q',...a])}closePath(){this.calls.push(['z'])}}
   const capture=mode=>{const fills=[];const ctx={fillStyle:'',save(){},restore(){},clip(){},fill(p){fills.push({color:this.fillStyle,path:p.calls})}};drawPatternFace(ctx,recipe,{x:0,y:0,width:384,height:384},mode);return fills}
   assert.deepEqual(capture(undefined),capture(false))
   assert.equal(capture(true).length,capture(false).length)
   assert.deepEqual(capture(true).map(x=>x.color),capture(false).map(x=>x.color))
   assert.deepEqual(recipe,before)
   assert.deepEqual(restoreWorkshop(JSON.stringify(saveFinalPattern(state,recipe))).finalPattern,recipe)
  }finally{globalThis.Path2D=originalPath}
 }
})
