/** Presentation-only sRGB pigment blend. Never changes the saved pattern. */
export function blendPigment(soft:Uint8ClampedArray,fired:Uint8ClampedArray,out:Uint8ClampedArray,progress:number){
 const p=Math.max(0,Math.min(1,progress))
 for(let i=0;i<out.length;i+=4){for(let c=0;c<3;c++)out[i+c]=Math.round(soft[i+c]*(1-p)+fired[i+c]*p);out[i+3]=fired[i+3]}
}
