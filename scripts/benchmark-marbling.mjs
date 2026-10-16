import {replay,modelFingerprint} from '../src/features/marbling/engine.ts'
const operations=Array.from({length:6000},(_,i)=>({kind:'drag',strokeId:Math.floor(i/50),from:{x:.4,y:.5},to:{x:.41,y:.51},time:i*16,pressure:.5,pointerType:'touch'}))
const start=performance.now(),a=replay(137,operations),duration=performance.now()-start
const b=replay(137,operations)
if(modelFingerprint(a)!==modelFingerprint(b))throw Error('Replay diverged')
console.log(JSON.stringify({operations:6000,columns:a.columns.length,layers:a.layers.length,replayMs:Math.round(duration),deterministic:true,note:'Node desktop benchmark; not mobile frame rate or browser GPU endurance.'}))
