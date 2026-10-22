import test from 'node:test'
import assert from 'node:assert/strict'
import {blendPigment} from '../src/features/shaping/pigment.ts'
test('firing pigment preserves warm channels, alpha and source buffers at every upload step',()=>{
 const soft=new Uint8ClampedArray([118,87,66,255,210,196,174,255]),fired=new Uint8ClampedArray([120,80,57,255,223,207,179,255]),a=soft.slice(),b=fired.slice(),out=new Uint8ClampedArray(8)
 for(let step=0;step<=32;step++){blendPigment(soft,fired,out,step/32);for(let i=0;i<8;i+=4){assert.ok(out[i]>=out[i+1]&&out[i+1]>=out[i+2]);assert.equal(out[i+3],255)}}
 assert.deepEqual(out,fired);blendPigment(soft,fired,out,0);assert.deepEqual(out,soft);assert.deepEqual(a,soft);assert.deepEqual(b,fired)
})
