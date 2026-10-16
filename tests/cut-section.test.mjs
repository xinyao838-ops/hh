import test from 'node:test'
import assert from 'node:assert/strict'
import {sampleCutSection,normalizeCut} from '../src/features/reveal/cutSection.ts'
import {replay,modelFingerprint} from '../src/features/marbling/engine.ts'
test('experimental cut is deterministic, source-preserving and location/angle dependent',()=>{
 const source={sourceKey:'verified-source',model:replay(137,[{kind:'fold'},{kind:'twist'},{kind:'fold'},{kind:'twist'}])}
 const before=JSON.stringify(source),params={version:1,position:.25,angleDegrees:12}
 const a=sampleCutSection(source,params),b=sampleCutSection(JSON.parse(before),params)
 assert.deepEqual(a,b);assert.equal(JSON.stringify(source),before);assert.equal(a.sourceKey,source.sourceKey)
 for(const cut of [{...params,position:.75},{...params,angleDegrees:-12}]){
  const other=sampleCutSection(source,cut)
  assert.notEqual(modelFingerprint(other.model),modelFingerprint(a.model))
 }
 assert.equal(a.model.columns.length,57)
 assert.ok(a.model.layers.every(l=>l.top.every(Number.isFinite)&&l.bottom.every(Number.isFinite)))
})
test('cut parameters reject unknown versions and invalid bounds, and quantize noise',()=>{
 for(const cut of [{version:2,position:.5,angleDegrees:0},{version:1,position:NaN,angleDegrees:0},{version:1,position:2,angleDegrees:0},{version:1,position:.5,angleDegrees:31}])assert.throws(()=>normalizeCut(cut))
 assert.deepEqual(normalizeCut({version:1,position:.123456,angleDegrees:12.3456}),{version:1,position:.1235,angleDegrees:12.35})
})
test('edge positions and maximum oblique angles do not invert thin material layers',()=>{
 const ops=[{kind:'fold'},{kind:'twist'},{kind:'fold'},{kind:'twist'},{kind:'fold'},{kind:'twist'},{kind:'twist'},{kind:'twist'}]
 const source={sourceKey:'edge-case',model:replay(137,ops)}
 for(const position of [0,.25,.5,.75,1])for(const angleDegrees of [-30,-15,0,15,30]){
  const result=sampleCutSection(source,{version:1,position,angleDegrees})
  for(const layer of result.model.layers)for(let i=0;i<57;i++)assert.ok(layer.top[i]<=layer.bottom[i])
 }
})
