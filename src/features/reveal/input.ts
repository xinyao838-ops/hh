import type { Point } from '../marbling/engine.ts'
/** The cut belongs to the user's stroke, not to a predetermined guide line. */
export class CutGesture {
  points:Point[]=[]
  active:number|null=null
  get position(){
    const inClay=this.points.filter(p=>p.y>=.315&&p.y<=.695)
    const points=inClay.length?inClay:this.points
    return points.length?points.reduce((sum,p)=>sum+p.x,0)/points.length:.64
  }
  begin(id:number,p:Point){
    if(this.active!==null)return false
    this.active=id;this.points=[p];return true
  }
  move(id:number,p:Point){if(this.active!==id)return;const old=this.points.at(-1)!;if(Math.hypot(p.x-old.x,p.y-old.y)>.003)this.points.push(p)}
  finish(id:number,cancelled=false){
    if(this.active!==id)return false
    this.active=null
    const first=this.points[0],last=this.points.at(-1)!
    let length=0,upward=0
    for(let i=1;i<this.points.length;i++){
      const a=this.points[i-1],b=this.points[i];length+=Math.hypot(b.x-a.x,b.y-a.y);upward+=Math.max(0,a.y-b.y)
    }
    return !cancelled && first.y<=.57 && last.y>=.69
      && last.y-first.y>=.20 && (last.y-first.y)/Math.max(.001,length)>.75 && upward<.075
      && this.position>=.177 && this.position<=.793
      && this.points.every(p=>Math.abs(p.x-this.position)<.10)
  }
}
