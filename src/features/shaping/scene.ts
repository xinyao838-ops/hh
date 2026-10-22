import { blendPigment } from './pigment'
import { firingMaterial } from '../kiln/model'
import * as THREE from 'three'
import type { FinalPattern } from '../reveal/pattern'
import { drawPatternFace } from '../reveal/render'
import { shapingConfig, type VesselType } from '../../config/shaping'
import { materialUV, vesselProfile } from './model'

export class ShapingScene {
  renderer:THREE.WebGLRenderer
  scene=new THREE.Scene()
  camera=new THREE.OrthographicCamera()
  mesh:THREE.Mesh<THREE.LatheGeometry,THREE.MeshPhysicalMaterial>
  private pigmentContext!:CanvasRenderingContext2D
  private softPixels!:ImageData
  private firedPixels!:ImageData
  private blendedPixels!:ImageData
  private pigmentStep=-1
  private kilnDepth=0
  private fitPoint=new THREE.Vector3()
  private fitOffset=new THREE.Vector3()
  private hemisphere=new THREE.HemisphereLight('#fff6e5','#64543f',2.1)
  private key=new THREE.DirectionalLight('#fff5e7',2.5)
  private fill=new THREE.DirectionalLight('#e7e1d5',.6)
  private shadowSize=1
  private segments:number
  private textures:THREE.Texture[]=[]
  private shadow:THREE.Mesh
  private ray=new THREE.Raycaster()
  private width=1
  private height=1
  private span=3.15
  private profileCount:number
  private slowFrames=0
  private disposed=false
  private seamNormal=new THREE.Vector3()
  constructor(private canvas:HTMLCanvasElement,recipe:FinalPattern){
    const memory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory
    const low=(memory!==undefined&&memory<=4)||navigator.hardwareConcurrency<=4
    this.segments=low?shapingConfig.lowSegments:shapingConfig.segments
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!low,powerPreference:'low-power',preserveDrawingBuffer:true})
    performance.mark('vessel-webgl-created')
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?shapingConfig.lowDpr:shapingConfig.maxDpr))
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05
    const size=low?shapingConfig.lowTextureSize:shapingConfig.textureSize
    const source=document.createElement('canvas');source.width=source.height=size
    const ctx=source.getContext('2d')!;ctx.fillStyle=recipe.colors[0];ctx.fillRect(0,0,size,size)
    drawPatternFace(ctx,recipe,{x:-size*.09,y:-size*.14,width:size*1.18,height:size*1.28})
    this.firedPixels=ctx.getImageData(0,0,size,size)
    // Matte greenware pigment treatment affects only the presentation texture.
    const pixels=ctx.getImageData(0,0,size,size);let seed=recipe.seed||1
    const grain=document.createElement('canvas');grain.width=grain.height=128;const gc=grain.getContext('2d')!,noise=gc.createImageData(128,128)
    for(let i=0;i<pixels.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const n=(seed>>>0)/4294967296
      const gray=pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11
      for(let c=0;c<3;c++)pixels.data[i+c]=pixels.data[i+c]*.87+gray*.07+190*.06+(n-.5)*2
    }
    for(let i=0;i<noise.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const n=(seed>>>0)/4294967296;noise.data[i]=noise.data[i+1]=noise.data[i+2]=120+n*15;noise.data[i+3]=255}
    ctx.putImageData(pixels,0,0);gc.putImageData(noise,0,0)
    this.pigmentContext=ctx;this.softPixels=pixels;this.blendedPixels=ctx.createImageData(size,size)
    const map=new THREE.CanvasTexture(source);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy())
    const bump=new THREE.CanvasTexture(grain);this.textures.push(map,bump)
    performance.mark('vessel-textures-prepared')
    const initial=vesselProfile('bowl',0);this.profileCount=initial.length
    const geometry=new THREE.LatheGeometry(initial.map(p=>new THREE.Vector2(p.r,p.y)),this.segments)
    const uv=geometry.getAttribute('uv')
    for(let i=0;i<=this.segments;i++)for(let j=0;j<initial.length;j++){const v=materialUV(i/this.segments*Math.PI*2,initial[j].materialRadius);uv.setXY(i*initial.length+j,v.u,v.v)}
    uv.needsUpdate=true
    this.mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({map,bumpMap:bump,bumpScale:.012,roughness:1,metalness:0,clearcoat:.0001,clearcoatRoughness:.42,reflectivity:.38,color:'#e5e1d9',side:THREE.DoubleSide}))
    // One light setup spans greenware and fired porcelain without shader swaps.
    this.mesh.material.envMapIntensity=0;this.mesh.material.envMapRotation.y=.4
    // Use Three.js's standard sRGB map pipeline on every device. No custom
    // second texture sampler or device-specific shader pigment conversion.
    this.scene.add(this.mesh)
    this.scene.add(this.hemisphere);this.key.position.set(-3,5,4);this.scene.add(this.key);this.fill.position.set(3,2,-2);this.scene.add(this.fill)
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!
    const gradient=sc.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'#37251955');gradient.addColorStop(.45,'#37251928');gradient.addColorStop(1,'#37251900');sc.fillStyle=gradient;sc.fillRect(0,0,128,128)
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas);this.textures.push(shadowTexture)
    this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.7),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=.006;this.scene.add(this.shadow)
    this.camera.position.set(0,3.3,5.5);this.camera.lookAt(0,.55,0)
    canvas.dataset.sceneId=this.scene.uuid;canvas.dataset.meshId=this.mesh.uuid;canvas.dataset.cameraId=this.camera.uuid
    canvas.dataset.quality=low?'low':'standard';canvas.dataset.renderer='webgl';canvas.dataset.sourceKey=recipe.sourceKey;canvas.dataset.textureSize=String(size);canvas.dataset.dpr=String(this.renderer.getPixelRatio())
  }
  private frameVessel(){const span=this.span;this.camera.left=-span/2;this.camera.right=span/2;this.camera.top=span*this.height/this.width/2;this.camera.bottom=-this.camera.top;this.camera.near=.1;this.camera.far=30;this.camera.updateProjectionMatrix()}
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.renderer.setSize(this.width,this.height,false);this.frameVessel()}
  update(type:VesselType,progress:number){
    // Framing grows continuously with the lift; the wide plate stays inside the table.
    this.span=3.15-(type==='cup'?.55:type==='bowl'?.18:.08)*progress;this.frameVessel()
    const profile=vesselProfile(type,progress),position=this.mesh.geometry.getAttribute('position')
    for(let i=0;i<=this.segments;i++){const a=i/this.segments*Math.PI*2,s=Math.sin(a),c=Math.cos(a)
      for(let j=0;j<this.profileCount;j++){const p=profile[j];position.setXYZ(i*this.profileCount+j,p.r*s,p.y,p.r*c)}
    }
    position.needsUpdate=true;this.mesh.geometry.computeVertexNormals();
    const normals=this.mesh.geometry.getAttribute('normal')
    for(let j=0;j<this.profileCount;j++){const k=this.segments*this.profileCount+j,v=this.seamNormal.set(normals.getX(j)+normals.getX(k),normals.getY(j)+normals.getY(k),normals.getZ(j)+normals.getZ(k)).normalize();normals.setXYZ(j,v.x,v.y,v.z);normals.setXYZ(k,v.x,v.y,v.z)}
    normals.needsUpdate=true;this.mesh.geometry.computeBoundingSphere();this.mesh.geometry.computeBoundingBox()
    this.shadowSize=type==='plate'?1+.18*progress:1-.1*progress;this.shadow.scale.setScalar(this.shadowSize)
  }
  atmosphere(firing=0,depth=0,heat=0,approach=0){
    // Fired sheen uses the existing soft key/fill and physical clearcoat.
    // Avoid first-fire PMREM/shader generation: no extra scene or environment
    // textures are allocated while the kiln animation is running.
    const m=firingMaterial(firing),material=this.mesh.material
    const step=Math.round(m.pigmentMix*32)
    if(step!==this.pigmentStep){this.pigmentStep=step;blendPigment(this.softPixels.data,this.firedPixels.data,this.blendedPixels.data,step/32);this.pigmentContext.putImageData(this.blendedPixels,0,0);material.map!.needsUpdate=true}
    material.roughness=m.roughness;material.bumpScale=m.bumpScale*.8;material.clearcoat=m.clearcoat;material.clearcoatRoughness=m.clearcoatRoughness;material.envMapIntensity=m.envIntensity
    material.color.set('#e5e1d9').lerp(new THREE.Color('#fff7ec'),firing*.55)
    this.kilnDepth=depth;const size=1-depth*.28;this.mesh.scale.setScalar(size);this.mesh.position.set(0,0,-depth*.8)
    this.shadow.position.z=-depth*.8;this.shadow.scale.setScalar(this.shadowSize*size)
    this.camera.zoom=1+approach;this.camera.updateProjectionMatrix()
    this.hemisphere.intensity=(2.1-.65*firing)*(1-depth*.78);this.key.intensity=(2.5-.25*firing)*(1-depth*.72)+heat*2.6;this.fill.intensity=(.6-.12*firing)*(1-depth*.55)
    this.key.color.set('#fff5e7').lerp(new THREE.Color('#e88439'),Math.min(1,depth*.45+heat*.55))
    this.canvas.dataset.firingProgress=String(firing);this.canvas.dataset.roughness=String(material.roughness);this.canvas.dataset.pigmentMix=String(m.pigmentMix);this.canvas.dataset.clearcoat=String(material.clearcoat)
  }
  /** Fit actual projected geometry inside the narrow safe part of the arch.
   * Re-evaluated on render, including resize while the kiln is waiting. */
  private fitKiln(){
    const d=this.kilnDepth;if(d<=0)return
    const base=1-d*.28;this.mesh.scale.setScalar(base);this.mesh.position.set(0,0,-d*.8)
    this.camera.updateMatrixWorld(true);this.mesh.updateMatrixWorld(true)
    const positions=this.mesh.geometry.getAttribute('position')
    let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity
    for(let i=0;i<positions.count;i++){
      const p=this.fitPoint.fromBufferAttribute(positions,i).applyMatrix4(this.mesh.matrixWorld).project(this.camera)
      left=Math.min(left,p.x);right=Math.max(right,p.x);bottom=Math.min(bottom,p.y);top=Math.max(top,p.y)
    }
    // NDC +/- .48 width, height .94, centered slightly below arch crown.
    const fit=Math.min(1,.96/(right-left),.94/(top-bottom)),scale=1+(fit-1)*d
    const anchor=this.fitPoint.copy(this.mesh.position).project(this.camera).clone()
    const cx=(left+right)/2,cy=(top+bottom)/2
    const dx=-d*(anchor.x+(cx-anchor.x)*scale),dy=d*(-.12-(anchor.y+(cy-anchor.y)*scale))
    this.fitOffset.set(anchor.x+dx,anchor.y+dy,anchor.z).unproject(this.camera).sub(this.mesh.position)
    this.mesh.scale.setScalar(base*scale);this.mesh.position.add(this.fitOffset)
    this.shadow.scale.setScalar(this.shadowSize*base*scale);this.shadow.position.z=-d*.8
  }
  /** One synchronous export using the existing renderer, mesh, pigment and angle. */
  capture(width=940,height=790){
    if(this.disposed||this.renderer.getContext().isContextLost())throw Error('Vessel renderer unavailable')
    const out=document.createElement('canvas');out.width=width;out.height=height
    const ratio=this.renderer.getPixelRatio(),top=this.camera.top,bottom=this.camera.bottom,zoom=this.camera.zoom
    try{
      this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false)
      this.camera.top=this.span*height/width/2;this.camera.bottom=-this.camera.top;this.camera.updateProjectionMatrix()
      // Card aspect differs from the phone: fit the actual vessel bounds before
      // capture, including tall rims. Restore the live camera synchronously.
      this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true)
      const box=new THREE.Box3().setFromObject(this.mesh);let extent=0
      for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
        const p=new THREE.Vector3(x,y,z).project(this.camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y))
      }
      this.camera.zoom=zoom*Math.min(1,.90/Math.max(.01,extent));this.camera.updateProjectionMatrix()
      this.renderer.render(this.scene,this.camera);out.getContext('2d')!.drawImage(this.canvas,0,0,width,height)
    }finally{
      this.renderer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height,false)
      this.camera.top=top;this.camera.bottom=bottom;this.camera.zoom=zoom;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera)
    }
    return out
  }
  hit(x:number,y:number){this.scene.updateMatrixWorld(true);this.ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),this.camera);return this.ray.intersectObject(this.mesh,false).length>0}
  render(rotation:number){this.canvas.dataset.rotation=String(rotation);this.mesh.rotation.y=rotation;this.fitKiln();const began=performance.now();this.renderer.render(this.scene,this.camera)
    const cost=performance.now()-began;this.canvas.dataset.renderMs=cost.toFixed(2)
    this.slowFrames=cost>35?this.slowFrames+1:Math.max(0,this.slowFrames-1)
    if(this.slowFrames>=8&&this.renderer.getPixelRatio()>1){this.renderer.setPixelRatio(1);this.renderer.setSize(this.width,this.height,false);this.canvas.dataset.dpr='1';this.canvas.dataset.quality='adaptive';this.slowFrames=0}
    const box=new THREE.Box3().setFromObject(this.mesh),points=[]
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(this.camera);points.push({x:(p.x+1)/2,y:(1-p.y)/2})}
    this.canvas.dataset.bounds=JSON.stringify({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))})
    this.canvas.dataset.triangles=String(this.renderer.info.render.triangles)
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.mesh.geometry.dispose();this.mesh.material.dispose();this.shadow.geometry.dispose();(this.shadow.material as THREE.Material).dispose();this.textures.forEach(t=>t.dispose());this.textures=[];this.scene.clear();this.renderer.dispose()}
}
