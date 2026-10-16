/** Display-only convex corner rounding; never changes material columns or saved recipes. */
export interface DrawPoint {x:number;y:number}
export interface PathSink {moveTo(x:number,y:number):void;lineTo(x:number,y:number):void;quadraticCurveTo(cx:number,cy:number,x:number,y:number):void;closePath():void}
export function traceMaterialBoundary(path:PathSink,points:DrawPoint[],soft=false){
 if(!points.length)return
 if(!soft){path.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>path.lineTo(p.x,p.y));path.closePath();return}
 const last=points[points.length-1],first=points[0]
 path.moveTo((last.x+first.x)/2,(last.y+first.y)/2)
 points.forEach((p,i)=>{const next=points[(i+1)%points.length];path.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2)})
 path.closePath()
}
