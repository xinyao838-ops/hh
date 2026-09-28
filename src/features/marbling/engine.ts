import { marblingConfig } from '../../config/marbling.ts'
export interface Point { x: number; y: number }
export type InputKind = 'mouse' | 'touch' | 'pen'
export type CraftOperation =
  | { kind: 'drag'; from: Point; to: Point; pressure: number; time: number; strokeId: number; pointerType: InputKind }
  | { kind: 'press'; point: Point; strength: number }
  | { kind: 'twist' } | { kind: 'fold' }
export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
export function noise(seed: number, index: number) {
  const n = Math.sin(seed * .00013 + index * 127.1) * 43758.5453
  return n - Math.floor(n)
}
/** A transverse slice of one body. a/b begin as stacked, broad material lobes.
 * Monotone x and minimum radii preserve a substantial mass under repeated pulls. */
export interface ClayColumn { x: number; a: number; b: number; ra: number; rb: number; bond: number; warp: number; shear: number; strain: number; pressed: number; seam: number }
export interface MaterialLayer { material: 0 | 1; top: number[]; bottom: number[]; birth: number }
interface History {
  dragDistance: number; twistCount: number; foldCount: number; pressCount: number
  directionChanges: number; reverseFoldCount: number; crossingCount: number
  direction: Point; stroke: number; turnTravel: number
  lastCross: Point | null
  segments: { from: Point; to: Point; strokeId: number }[]
}
export interface ClayModel { seed: number; columns: ClayColumn[]; history: History; layers: MaterialLayer[] }
const emptyHistory = (): History => ({ dragDistance: 0, twistCount: 0, foldCount: 0, pressCount: 0,
  directionChanges: 0, reverseFoldCount: 0, crossingCount: 0, direction: { x: 0, y: 0 }, stroke: -1, turnTravel: 0, lastCross: null, segments: [] })
function intersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx
  if(Math.abs(den)<1e-10)return null
  const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/den,u=((c.x-a.x)*ry-(c.y-a.y)*rx)/den
  return t>1e-6&&t<=1+1e-6&&u>=-1e-6&&u<=1+1e-6?{x:a.x+t*rx,y:a.y+t*ry}:null
}
function advanceHistory(previous: History, op: CraftOperation): History {
  const h = { ...previous }
  if (op.kind === 'twist') h.twistCount++
  else if (op.kind === 'fold') h.foldCount++
  else if (op.kind === 'press') h.pressCount++
  else {
    const dx = op.to.x-op.from.x, dy = op.to.y-op.from.y, distance = Math.hypot(dx, dy)
    h.dragDistance += distance; h.turnTravel += distance
    if (distance > .00001) {
      const direction = { x: dx/distance, y: dy/distance }
      const dot = direction.x*h.direction.x + direction.y*h.direction.y
      // Ignore sub-pixel wobble; count purposeful reversals within a continuous pull.
      if (op.strokeId === h.stroke && h.turnTravel > .025 && dot < .45) {
        h.directionChanges++; if (dot < -.35) h.reverseFoldCount++
        h.turnTravel = 0; h.direction = direction
      } else if (op.strokeId !== h.stroke || h.turnTravel > .065) {
        h.direction = direction; h.turnTravel = 0
      }
      const crossed = h.segments.slice(0, -3).map(s => intersection(op.from,op.to,s.from,s.to)).find(p => p &&
        (!h.lastCross || Math.hypot(p.x-h.lastCross.x,p.y-h.lastCross.y)>.035))
      if (crossed) { h.crossingCount++; h.lastCross=crossed }
      h.stroke = op.strokeId
      h.segments = [...h.segments.slice(-63), { from: op.from, to: op.to, strokeId: op.strokeId }]
    }
  }
  return h
}
export function complexity(model: ClayModel) {
  return interactionProgress(model) * 10
}
export function interactionProgress(model: ClayModel) { return progressOf(model.history).interactionProgress }
export const layerMilestones = [.30, .40, .52, .65, .74, .83, .92] as const
export function initialModel(seed: number): ClayModel {
  return { seed, history: emptyHistory(), layers: [], columns: Array.from({ length: 57 }, (_, i) => {
    const u = i/56, irregular = Math.sin(u*9+noise(seed,1)*5)*.012, belly=Math.sin(u*Math.PI)*.025
    return { x: .11+u*.78, a: .425+irregular, b: .55+Math.sin(u*7+noise(seed,2)*4)*.012,
      ra: .092+belly+Math.sin(u*19+noise(seed,3)*6)*.005, rb: .098+belly+Math.sin(u*15+noise(seed,4)*6)*.006,
      bond: .34, warp: 0, shear: 0, strain: 0, pressed: 0, seam: .06*Math.sin(u*5+noise(seed,12)) }
  }) }
}
export function applyOperation(model: ClayModel, op: CraftOperation): ClayModel {
  const history = advanceHistory(model.history, op)
  const reversed = history.reverseFoldCount > model.history.reverseFoldCount
  const oldBond = Math.max(...model.columns.map(c => c.bond))
  const point = op.kind === 'drag' ? op.from : op.kind === 'press' ? op.point : { x: .5, y: .5 }
  const nearest = model.columns.reduce((a,b) => Math.abs(a.x-point.x)<Math.abs(b.x-point.x)?a:b)
  const selected = Math.abs(nearest.a-point.y) <= Math.abs(nearest.b-point.y) ? 0 : 1
  const dx = op.kind === 'drag' ? op.to.x-op.from.x : 0, dy = op.kind === 'drag' ? op.to.y-op.from.y : 0
  const distance = Math.hypot(dx,dy)
  const columns = model.columns.map((source, i) => {
    const c = { ...source }, u = i/(model.columns.length-1)
    const weight = Math.exp(-(((c.x-point.x)/.155)**2)/2)
    const shared = clamp(c.bond*2.5)
    if (op.kind === 'drag') {
      c.x += dx*weight*.65
      c.a += dy*weight*(selected===0 ? .94 : shared*.94)
      c.b += dy*weight*(selected===1 ? .94 : shared*.94)
      c.warp += (dy*2.4 + dx*Math.sin(u*7)*1.6)*weight
      c.shear += dx*weight*2
      c.strain += distance*weight*(1+Number(reversed)*2)
      // Pressure widens the contacting patch, without blending its pigments.
      if (shared > 0) {
        c.ra += (reversed ? .009 : distance*.012)*weight
        c.rb += (reversed ? .009 : distance*.012)*weight
      }
    } else if (op.kind === 'press') {
      c.x += Math.tanh((c.x-point.x)*12)*weight*.022*op.strength
      c.ra *= 1-.09*weight*op.strength; c.rb *= 1-.09*weight*op.strength
      c.pressed += weight*op.strength
      c.warp += .12*Math.sin(u*10)*weight*op.strength
      c.shear += (c.x-point.x)*weight*op.strength
      // Compress the gap locally; a detached lobe is not teleported across the table.
      const gap = Math.max(0,c.b-c.a-c.ra-c.rb)
      c.a += Math.min(.025,gap*.22)*weight; c.b -= Math.min(.025,gap*.22)*weight
    } else {
      const mid=(c.a+c.b)/2, half=(c.b-c.a)/2
      c.a=mid-half*.48; c.b=mid+half*.48
      if (op.kind === 'twist') {
        const wave=Math.sin(u*Math.PI*2+model.history.twistCount*.7)*.03
        c.a+=wave; c.b+=wave; c.warp+=.26*Math.sin(u*7+model.history.twistCount*.8)
        c.shear += .12*Math.cos(u*6)
      } else {
        c.x=.5+(c.x-.5)*.93
        c.a+=Math.sin(u*Math.PI)*.02; c.b+=Math.sin(u*Math.PI)*.02
        c.ra+=.012; c.rb+=.012
        c.warp+=.32*Math.sin(u*9+model.history.foldCount); c.shear-=.17*Math.cos(u*5)
      }
      c.bond=clamp(c.bond+.30); c.strain+=.15*(.35+.65*Math.sin(u*Math.PI)**2)
    }
    const touching = c.b-c.a <= c.ra+c.rb+.025
    if (touching) c.bond=clamp(c.bond+distance*weight*4+(op.kind==='press' ? .22*weight : 0))
    if (oldBond > .15) c.bond=clamp(c.bond+distance*(.65+weight*1.4)*oldBond+(op.kind==='press' ? .05*weight : 0))
    // Once bonded, the two lobes cannot pass through or separate again.
    if (c.bond > 0) {
      const mid=(c.a+c.b)/2, target=.092
      const compression=op.kind==='drag'?distance*1.2:op.kind==='press'?.09:.18
      const separation=Math.max(.072,Math.min(c.b-c.a,(c.b-c.a)*(1-c.bond*compression)+target*c.bond*compression))
      c.a=mid-separation/2; c.b=mid+separation/2
    }
    c.ra=clamp(c.ra,.063,.135); c.rb=clamp(c.rb,.063,.135)
    const shift=clamp((c.a+c.b)/2,.24,.76)-(c.a+c.b)/2
    c.a+=shift; c.b+=shift
    c.a=clamp(c.a,.15,.8); c.b=clamp(c.b,c.a+.065,.86)
    c.x=clamp(c.x,.065+u*.48,.455+u*.48)
    c.warp=clamp(c.warp,-2.5,2.5); c.shear=clamp(c.shear,-1.5,1.5)
    c.strain=Math.min(c.strain,8); c.pressed=Math.min(c.pressed,6)
    return c
  })
  // A cohesive material cannot be pulled into a zero-width string or self-crossing spine.
  for(let i=1;i<columns.length;i++) columns[i].x=Math.max(columns[i].x,columns[i-1].x+.008)
  for(let i=columns.length-2;i>=0;i--) columns[i].x=Math.min(columns[i].x,columns[i+1].x-.008)
  // Approximate local volume: stretching a slice narrows its section. This SAME
  // changing section is used by every material boundary, not only the silhouette.
  if(op.kind==='drag') for(let i=0;i<columns.length;i++) {
    const lo=Math.max(0,i-1),hi=Math.min(columns.length-1,i+1)
    const oldSpan=Math.hypot(model.columns[hi].x-model.columns[lo].x,(model.columns[hi].a+model.columns[hi].b-model.columns[lo].a-model.columns[lo].b)/2)
    const span=Math.hypot(columns[hi].x-columns[lo].x,(columns[hi].a+columns[hi].b-columns[lo].a-columns[lo].b)/2)
    const ratio=clamp(Math.sqrt(oldSpan/Math.max(.001,span)),.90,1.08)
    columns[i].ra=clamp(columns[i].ra*ratio,.065,.16);columns[i].rb=clamp(columns[i].rb*ratio,.065,.16)
  }
  const advect=(value:number,i:number) => {
    const c=columns[i],old=model.columns[i],u=i/(columns.length-1)
    const s=sectionAt(old,u),y=(s.top+s.bottom)/2+value*(s.bottom-s.top)/2
    const weight=Math.exp(-(((old.x-point.x)/.155)**2)/2)
    if(op.kind==='drag') {
      const mid=(s.top+s.bottom)/2
      const near=Math.exp(-(((y-point.y)/.16)**2)/2),center=Math.exp(-(((mid-point.y)/.16)**2)/2)
      return clamp(value+dy*weight*(near-center)*3.2+dx*weight*(value-old.seam)*.18,-1.3,1.3)
    }
    if(op.kind==='press')return clamp(value*(1+.055*weight*op.strength),-1.3,1.3)
    const wave=Math.sin(u*(op.kind==='fold'?5.5:6.2)+model.history.foldCount*.5)*.09
    return clamp(value+wave*(1-value*value*.4)+c.shear*.015,-1.3,1.3)
  }
  columns.forEach((c,i)=>{c.seam=advect(model.columns[i].seam,i)})
  const layers=model.layers.map(layer=>({...layer,top:layer.top.map(advect),bottom:layer.bottom.map(advect)}))
  const next:ClayModel={seed:model.seed,columns,history,layers},progress=interactionProgress(next)
  // New laminae are born only after meaningful work. They inherit the deformed
  // interface and remain attached to these material columns on all later pulls.
  while(layers.length<layerMilestones.length && progress>=layerMilestones[layers.length]) {
    const index=layers.length,late=index>=3,parent=late?layers[index-3]:null
    const material=(parent?1-parent.material:index%2) as 0|1,sign=material===0?1:-1
    const focus=late?columns.reduce((best,c,i)=>c.strain>columns[best].strain?i:best,0):columns.indexOf(columns.reduce((a,b)=>Math.abs(a.x-point.x)<Math.abs(b.x-point.x)?a:b))
    const center=clamp(focus/(columns.length-1),.2,.8),radius=late?.24:.39
    const top:number[]=[],bottom:number[]=[]
    columns.forEach((c,i)=>{
      const u=i/(columns.length-1),q=(u-center)/radius
      const envelope=Math.max(0,1-q*q)**2*(parent?clamp((parent.bottom[i]-parent.top[i])/.12):1)
      const inherited=parent?(parent.top[i]+parent.bottom[i])/2:c.seam
      const bend=sign*(index>=6?.008:late?.025:.34)*Math.sin(envelope*Math.PI*.7)
      const middle=inherited+bend+envelope*c.warp*.035
      const half=(index>=6?.018:late?.035:.16)*envelope*(.85+.15*Math.sin(u*5+index))
      top.push(middle-half);bottom.push(middle+half)
    })
    layers.push({material,top,bottom,birth:layerMilestones[index]})
  }
  return next
}
/** Shared silhouette: zero gap means ONE body, with no per-colour outlines. */
export function sectionAt(c: ClayColumn, u: number) {
  const cap=Math.sqrt(Math.max(0,1-Math.abs((clamp(u,.001,.999)-.5)/.5)**3))
  const mid=(c.a+c.b)/2, top=mid-((c.b-c.a)/2+c.ra)*cap, bottom=mid+((c.b-c.a)/2+c.rb)*cap
  const gap=Math.max(0,c.b-c.a-(c.ra+c.rb)*cap)*(1-clamp(c.bond*3))
  return { top, bottom, mid, gap, cap }
}
export function hitClay(model: ClayModel, point: Point) {
  if(point.x<model.columns[0].x||point.x>model.columns.at(-1)!.x) return false
  const i=model.columns.reduce((best,c,index)=>Math.abs(c.x-point.x)<Math.abs(model.columns[best].x-point.x)?index:best,0)
  const {top,bottom,mid,gap}=sectionAt(model.columns[i],i/(model.columns.length-1))
  return point.y>=top && point.y<=bottom && (gap<.002 || Math.abs(point.y-mid)>=gap/2)
}
export function replay(seed: number, operations: CraftOperation[]) { return operations.reduce(applyOperation, initialModel(seed)) }
export function measureOperations(operations: CraftOperation[]) {
  return progressOf(operations.reduce(advanceHistory,emptyHistory()))
}
export function modelProgress(model: ClayModel) { return {...progressOf(model.history),fusion:model.columns.reduce((sum,c)=>sum+c.bond,0)/model.columns.length} }
function progressOf(history: History) {
  const {dragDistance,twistCount,foldCount,pressCount,directionChanges,reverseFoldCount,crossingCount}=history
  const interactionProgress=clamp(dragDistance*.20+directionChanges*.015+reverseFoldCount*.025+crossingCount*.025+pressCount*.025+twistCount*.07+foldCount*.11)
  return {dragDistance,twistCount,foldCount,pressCount,directionChanges,reverseFoldCount,crossingCount,
    interactionProgress,ready:interactionProgress>=marblingConfig.minInteractionProgress}
}
export function interpolate(from: ClayModel, to: ClayModel, t: number): ClayModel {
  const history={...to.history}
  for(const key of ['dragDistance','twistCount','foldCount','pressCount','directionChanges','reverseFoldCount','crossingCount'] as const)
    history[key]=from.history[key]+(to.history[key]-from.history[key])*t
  const layers=to.layers.map((layer,i)=>{
    const old=from.layers[i]
    return {...layer,top:layer.top.map((v,j)=>old?old.top[j]+(v-old.top[j])*t:(layer.top[j]+layer.bottom[j])/2+(v-(layer.top[j]+layer.bottom[j])/2)*t),
      bottom:layer.bottom.map((v,j)=>old?old.bottom[j]+(v-old.bottom[j])*t:(layer.top[j]+layer.bottom[j])/2+(v-(layer.top[j]+layer.bottom[j])/2)*t)}
  })
  return {...to,history,layers,columns:to.columns.map((c,i)=>Object.fromEntries(Object.entries(c).map(([key,value])=>
    [key,from.columns[i][key as keyof ClayColumn]+(value-from.columns[i][key as keyof ClayColumn])*t])) as unknown as ClayColumn)}
}
export function modelFingerprint(model: ClayModel) {
  let hash=2166136261
  for(const c of model.columns) for(const n of Object.values(c)) hash=Math.imul(hash^Math.round(n*1e6),16777619)
  for(const layer of model.layers) for(const n of [...layer.top,...layer.bottom,layer.material,layer.birth]) hash=Math.imul(hash^Math.round(n*1e6),16777619)
  for(const n of [model.seed,complexity(model)]) hash=Math.imul(hash^Math.round(n*1e6),16777619)
  return (hash>>>0).toString(16).padStart(8,'0')
}
