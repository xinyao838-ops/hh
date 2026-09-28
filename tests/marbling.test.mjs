import test from 'node:test'
import assert from 'node:assert/strict'
import { initialModel, applyOperation, replay, hitClay, modelFingerprint, measureOperations, complexity, sectionAt, interactionProgress } from '../src/features/marbling/engine.ts'
import { materialPoint } from '../src/features/marbling/render.ts'
import { DragSession, localPoint } from '../src/features/marbling/input.ts'
import { createWorkshopState, toggleClay, saveOperations, restoreWorkshop } from '../src/state/workshopModel.ts'
import { marblingConfig } from '../src/config/marbling.ts'
const drag=(x=.45,y=.35,toX=.61,toY=.62,kind='mouse')=>({kind:'drag',from:{x,y},to:{x:toX,y:toY},pressure:.5,time:200,strokeId:1,pointerType:kind})
const chosen=()=>toggleClay(toggleClay(createWorkshopState(),'ivory'),'terracotta')
const pull=(from,to,n=24)=>Array.from({length:n},(_,i)=>drag(from.x+(to.x-from.x)*i/n,from.y+(to.y-from.y)*i/n,from.x+(to.x-from.x)*(i+1)/n,from.y+(to.y-from.y)*(i+1)/n,'touch'))
const encounter=pull({x:.45,y:.35},{x:.50,y:.63})
const knead=[...encounter,...pull({x:.50,y:.63},{x:.72,y:.43}),...pull({x:.72,y:.43},{x:.28,y:.59}),...pull({x:.28,y:.59},{x:.65,y:.44})]
const fusion=m=>m.columns.reduce((sum,c)=>sum+c.bond,0)/m.columns.length

test('different paths and seeds generate distinct material geometry',()=>{
  const a=replay(173,[drag()]),b=replay(173,[drag(.35,.35,.27,.18)])
  assert.notEqual(modelFingerprint(a),modelFingerprint(b))
  assert.notEqual(modelFingerprint(a),modelFingerprint(replay(174,[drag()])))
})
test('ordered replay including press reproduces both shared body and internal coordinates',()=>{
  const ops=[...knead,{kind:'press',point:{x:.5,y:.53},strength:.85},{kind:'twist'},{kind:'fold'}]
  assert.deepEqual(replay(402,ops),replay(402,JSON.parse(JSON.stringify(ops))))
  assert.notEqual(modelFingerprint(replay(402,ops)),modelFingerprint(replay(402,ops.toReversed())))
})
test('two broad stacked colours bond further with work and retain a shared silhouette',()=>{
  const initial=initialModel(19),contact=replay(19,encounter),worked=replay(19,knead)
  assert.ok(fusion(initial)>.3 && fusion(initial)<.4)
  assert.ok(fusion(contact)>fusion(initial))
  assert.ok(fusion(worked)>.9)
  assert.ok(fusion(worked)>fusion(contact))
  for(let i=0;i<worked.columns.length;i++) assert.equal(sectionAt(worked.columns[i],i/56).gap,0)
})
test('first 30 percent contains only two broad colours, no decorative fine layers',()=>{
  const model=replay(19,[...encounter,...pull({x:.50,y:.63},{x:.60,y:.55})])
  assert.ok(interactionProgress(model)<.3)
  assert.equal(model.layers.length,0)
  assert.equal(initialModel(19).layers.length,0)
})
test('five twists and three folds produce one bounded substantial body, not duplicated strands',()=>{
  const ops=[...Array(5).fill({kind:'twist'}),...Array(3).fill({kind:'fold'})],model=replay(19,ops)
  assert.equal(model.columns.length,57)
  assert.equal(fusion(model),1)
  const stats=measureOperations(ops)
  assert.equal(stats.twistCount,5);assert.equal(stats.foldCount,3);assert.equal(stats.ready,true)
  for(const c of model.columns) {
    assert.ok(c.x>=.06&&c.x<=.94&&c.a>=.1&&c.b<=.9)
    assert.ok(c.ra>=.063&&c.rb>=.063)
  }
})
test('long press flattens a bonded patch, widens it and spreads its colour layers',()=>{
  const model=replay(111,knead),after=applyOperation(model,{kind:'press',point:{x:.5,y:.5},strength:.85})
  const center=model.columns.reduce((best,c,i)=>Math.abs(c.x-.5)<Math.abs(model.columns[best].x-.5)?i:best,0)
  assert.ok(after.columns[center].ra<model.columns[center].ra)
  assert.ok(after.columns[center+6].x-after.columns[center-6].x>model.columns[center+6].x-model.columns[center-6].x)
  assert.equal(after.history.pressCount,1)
  assert.ok(complexity(after)>complexity(model))
  assert.notEqual(after.columns[center].warp,model.columns[center].warp)
})
test('distance, reversals, crossing, twist, fold and press all contribute to lamination',()=>{
  const simple=replay(19,encounter),worked=replay(19,knead)
  assert.ok(worked.history.reverseFoldCount>0&&worked.history.directionChanges>0)
  assert.ok(complexity(worked)>complexity(simple))
  for(const op of [{kind:'twist'},{kind:'fold'},{kind:'press',point:{x:.5,y:.5},strength:.85}]) assert.ok(complexity(applyOperation(simple,op))>complexity(simple))
  const crossed=replay(19,[...pull({x:.3,y:.3},{x:.7,y:.7}),...pull({x:.7,y:.7},{x:.7,y:.3}),...pull({x:.7,y:.3},{x:.3,y:.7})])
  assert.ok(crossed.history.crossingCount>0)
})
test('mouse, touch and pen share hit gating and single contact ownership',()=>{
  const rect={left:20,top:150,width:350,height:340},start=localPoint(195,276,rect),end=localPoint(242,337,rect)
  for(const kind of ['mouse','touch','pen']) {
    const session=new DragSession(),model=initialModel(142)
    assert.equal(session.begin(1,{x:0,y:0},kind,hitClay(model,{x:0,y:0})),false)
    assert.equal(session.begin(1,start,kind,hitClay(model,start)),true)
    assert.equal(session.begin(2,end,kind,true),false);assert.equal(session.move(2,end,.7),null)
    const segment=session.move(1,end,.7);assert.equal(segment.pointerType,kind)
    assert.notDeepEqual(applyOperation(model,{kind:'drag',...segment,time:100,strokeId:1}),model)
    assert.equal(session.end(2),false);assert.equal(session.end(1),true)
  }
})
test('invitation waits for the minimum progress and cannot appear on a tiny initial drag',()=>{
  assert.equal(measureOperations([]).ready,false)
  assert.equal(measureOperations([drag(.5,.4,.501,.401)]).ready,false)
  assert.equal(measureOperations([drag()]).ready,false)
  assert.equal(measureOperations([{kind:'fold'}]).ready,false)
  assert.equal(measureOperations(knead).ready,true)
})
test('refresh retains colours, seed, press, complete history, counters and current PNG',()=>{
  const state=chosen(),ops=[...knead,{kind:'press',point:{x:.5,y:.5},strength:.85},{kind:'fold'}]
  const pattern={imageDataUrl:'data:image/png;base64,AAAA',width:384,height:384,seed:state.interactionSeed,algorithmVersion:marblingConfig.version,operationCount:ops.length}
  const saved=saveOperations(state,ops,pattern),restored=restoreWorkshop(JSON.stringify(saved))
  assert.deepEqual(restored,saved)
  assert.equal(modelFingerprint(replay(saved.interactionSeed,saved.operationLog)),modelFingerprint(replay(restored.interactionSeed,restored.operationLog)))
})
test('old logs replay in the new engine, obsolete PNG is invalidated, v1 colours remain',()=>{
  const old={...chosen(),schemaVersion:1};delete old.interactionSeed;delete old.operationLog
  const a=restoreWorkshop(JSON.stringify(old)),b=restoreWorkshop(JSON.stringify(old))
  assert.equal(a.interactionSeed,b.interactionSeed);assert.deepEqual(a.selectedClays,old.selectedClays)
  const v2=saveOperations(chosen(),[drag(),{kind:'fold'}]);delete v2.pressCount
  const restored=restoreWorkshop(JSON.stringify({...v2,generatedPattern:{algorithmVersion:2,imageDataUrl:'data:image/png;base64,AAAA'}}))
  assert.deepEqual(restored.operationLog,v2.operationLog);assert.equal(restored.pressCount,0);assert.equal(restored.generatedPattern,null)
})
test('material changes clear derived state; malformed press/drag/counters cannot enter replay',()=>{
  const saved=saveOperations(chosen(),[drag(),{kind:'press',point:{x:.5,y:.5},strength:.85}])
  const changed=toggleClay(saved,'ivory')
  assert.deepEqual(changed.operationLog,[]);assert.equal(changed.pressCount,0)
  for(const log of [[{...drag(),to:{x:NaN,y:.5}}],[{kind:'press',point:{x:2,y:0},strength:1}],[{kind:'press',point:{x:.5,y:.5},strength:Infinity}],Array(4).fill({kind:'fold'}),Array(6).fill({kind:'twist'})]) {
    const restored=restoreWorkshop(JSON.stringify({...saved,operationLog:log}))
    assert.deepEqual(restored.operationLog,[]);assert.deepEqual(restored.selectedClays,saved.selectedClays)
  }
})
test('1000 pulls cannot erode mass into strings or invert its horizontal mesh',()=>{
  let model=replay(157,knead)
  for(let i=0;i<1000;i++)model=applyOperation(model,drag(.48,.46,.48+Math.sin(i)*.013,.46+Math.cos(i)*.013))
  assert.ok(model.columns.at(-1).x-model.columns[0].x>.44)
  for(let i=0;i<model.columns.length;i++) {
    const c=model.columns[i],s=sectionAt(c,i/56)
    assert.ok(c.ra>=.063&&c.rb>=.063)
    assert.ok(s.bottom-s.top>(i>2&&i<54?.08:.012))
    if(i)assert.ok(c.x-model.columns[i-1].x>=.0079)
  }
})
test('middle phase adds wide local strata; late phase adds fine local strata without filling every region',()=>{
  const middle=replay(173,[...knead,{kind:'fold'}])
  const late=replay(173,[...knead,...Array(5).fill({kind:'twist'}),...Array(3).fill({kind:'fold'})])
  assert.ok(interactionProgress(middle)>.3&&interactionProgress(middle)<.65)
  assert.ok(middle.layers.length>0&&middle.layers.length<=3)
  assert.ok(late.layers.length>middle.layers.length)
  const fine=late.layers.filter(layer=>layer.birth>=.65)
  assert.ok(fine.length>0)
  for(const layer of fine){
    assert.ok(layer.top.some((v,i)=>layer.bottom[i]-v>.01))
    assert.ok(layer.top.filter((v,i)=>Math.abs(layer.bottom[i]-v)<.00001).length>20)
  }
})
test('material boundaries move with the very same deformed body slices under pulling and pressing',()=>{
  const model=replay(173,[...knead,{kind:'fold'}]),i=28
  const s=sectionAt(model.columns[i],i/56),mid=(s.top+s.bottom)/2
  const after=applyOperation(model,drag(model.columns[i].x,mid,model.columns[i].x+.1,mid+.05))
  const beforePoint=materialPoint(model,i,model.layers[0].top[i]),afterPoint=materialPoint(after,i,after.layers[0].top[i])
  assert.equal(afterPoint.x,after.columns[i].x)
  assert.notEqual(beforePoint.x,afterPoint.x);assert.notEqual(beforePoint.y,afterPoint.y)
  assert.notEqual(model.columns[i].ra,after.columns[i].ra)
  const pressed=applyOperation(model,{kind:'press',point:{x:model.columns[i].x,y:mid},strength:.85})
  const pressedPoint=materialPoint(pressed,i,pressed.layers[0].top[i])
  assert.notEqual(pressedPoint.y,beforePoint.y)
})
