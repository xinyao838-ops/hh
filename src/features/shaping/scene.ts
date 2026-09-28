import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
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
  private environment:THREE.WebGLRenderTarget
  private firingUniform={value:0}
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
  private profileCount:number
  constructor(private canvas:HTMLCanvasElement,recipe:FinalPattern){
    const memory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory
    const low=(memory!==undefined&&memory<=4)||navigator.hardwareConcurrency<=4
    this.segments=low?shapingConfig.lowSegments:shapingConfig.segments
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!low,powerPreference:'low-power',preserveDrawingBuffer:true})
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?shapingConfig.lowDpr:shapingConfig.maxDpr))
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05
    const size=low?shapingConfig.lowTextureSize:shapingConfig.textureSize
    const source=document.createElement('canvas');source.width=source.height=size
    const ctx=source.getContext('2d')!;ctx.fillStyle=recipe.colors[0];ctx.fillRect(0,0,size,size)
    drawPatternFace(ctx,recipe,{x:-size*.09,y:-size*.14,width:size*1.18,height:size*1.28})
    const firedSource=document.createElement('canvas');firedSource.width=firedSource.height=size
    firedSource.getContext('2d')!.drawImage(source,0,0)
    const firedMap=new THREE.CanvasTexture(firedSource);firedMap.colorSpace=THREE.SRGBColorSpace;this.textures.push(firedMap)
    // Matte greenware pigment treatment affects only the presentation texture.
    const pixels=ctx.getImageData(0,0,size,size);let seed=recipe.seed||1
    const grain=document.createElement('canvas');grain.width=grain.height=size;const gc=grain.getContext('2d')!,noise=gc.createImageData(size,size)
    for(let i=0;i<pixels.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const n=(seed>>>0)/4294967296
      const gray=pixels.data[i]*.3+pixels.data[i+1]*.59+pixels.data[i+2]*.11
      for(let c=0;c<3;c++)pixels.data[i+c]=pixels.data[i+c]*.87+gray*.07+190*.06+(n-.5)*2
      noise.data[i]=noise.data[i+1]=noise.data[i+2]=120+n*15;noise.data[i+3]=255
    }
    ctx.putImageData(pixels,0,0);gc.putImageData(noise,0,0)
    const map=new THREE.CanvasTexture(source);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy())
    const bump=new THREE.CanvasTexture(grain);this.textures.push(map,bump)
    const initial=vesselProfile('bowl',0);this.profileCount=initial.length
    const geometry=new THREE.LatheGeometry(initial.map(p=>new THREE.Vector2(p.r,p.y)),this.segments)
    const uv=geometry.getAttribute('uv')
    for(let i=0;i<=this.segments;i++)for(let j=0;j<initial.length;j++){const v=materialUV(i/this.segments*Math.PI*2,initial[j].materialRadius);uv.setXY(i*initial.length+j,v.u,v.v)}
    uv.needsUpdate=true
    this.mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({map,bumpMap:bump,bumpScale:.018,roughness:1,metalness:0,clearcoat:.0001,clearcoatRoughness:.42,reflectivity:.38,color:'#e5e1d9',side:THREE.DoubleSide}))
    const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment()
    this.environment=pmrem.fromScene(room,.08,.1,100,{size:low?64:128});room.dispose();pmrem.dispose()
    this.mesh.material.envMap=this.environment.texture;this.mesh.material.envMapIntensity=0;this.mesh.material.envMapRotation.y=.4
    this.mesh.material.onBeforeCompile=shader=>{
      shader.uniforms.uFiring=this.firingUniform;shader.uniforms.uFiredMap={value:firedMap}
      shader.fragmentShader='uniform float uFiring; uniform sampler2D uFiredMap;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        #ifdef USE_MAP
        vec4 softClay = texture2D(map, vMapUv);
        vec4 firedClay = texture2D(uFiredMap, vMapUv);
        vec3 pigment = mix(softClay.rgb, firedClay.rgb, uFiring);
        float luminance = dot(pigment, vec3(0.2126, 0.7152, 0.0722));
        pigment = mix(vec3(luminance), pigment, 1.0 + 0.06 * uFiring);
        pigment = (pigment - 0.18) * (1.0 + 0.08 * uFiring) + 0.18;
        diffuseColor *= vec4(max(pigment, vec3(0.0)), softClay.a);
        #endif
      `)
    }
    this.mesh.material.customProgramCacheKey=()=> 'jiaoyiwen-firing-v1'
    this.scene.add(this.mesh)
    this.scene.add(this.hemisphere);this.key.position.set(-3,5,4);this.scene.add(this.key);this.fill.position.set(3,2,-2);this.scene.add(this.fill)
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!
    const gradient=sc.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'#37251955');gradient.addColorStop(.45,'#37251928');gradient.addColorStop(1,'#37251900');sc.fillStyle=gradient;sc.fillRect(0,0,128,128)
    const shadowTexture=new THREE.CanvasTexture(shadowCanvas);this.textures.push(shadowTexture)
    this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.7,2.7),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.position.y=.006;this.scene.add(this.shadow)
    this.camera.position.set(0,3.3,5.5);this.camera.lookAt(0,.55,0)
    canvas.dataset.sceneId=this.scene.uuid;canvas.dataset.meshId=this.mesh.uuid;canvas.dataset.cameraId=this.camera.uuid
    canvas.dataset.renderer='webgl';canvas.dataset.sourceKey=recipe.sourceKey;canvas.dataset.textureSize=String(size);canvas.dataset.dpr=String(this.renderer.getPixelRatio())
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.renderer.setSize(this.width,this.height,false);const span=3.35;this.camera.left=-span/2;this.camera.right=span/2;this.camera.top=span*this.height/this.width/2;this.camera.bottom=-this.camera.top;this.camera.near=.1;this.camera.far=30;this.camera.updateProjectionMatrix()}
  update(type:VesselType,progress:number){
    const profile=vesselProfile(type,progress),position=this.mesh.geometry.getAttribute('position')
    for(let i=0;i<=this.segments;i++){const a=i/this.segments*Math.PI*2,s=Math.sin(a),c=Math.cos(a)
      for(let j=0;j<this.profileCount;j++){const p=profile[j];position.setXYZ(i*this.profileCount+j,p.r*s,p.y,p.r*c)}
    }
    position.needsUpdate=true;this.mesh.geometry.computeVertexNormals();
    const normals=this.mesh.geometry.getAttribute('normal')
    for(let j=0;j<this.profileCount;j++){const k=this.segments*this.profileCount+j,v=new THREE.Vector3(normals.getX(j)+normals.getX(k),normals.getY(j)+normals.getY(k),normals.getZ(j)+normals.getZ(k)).normalize();normals.setXYZ(j,v.x,v.y,v.z);normals.setXYZ(k,v.x,v.y,v.z)}
    normals.needsUpdate=true;this.mesh.geometry.computeBoundingSphere();this.mesh.geometry.computeBoundingBox()
    this.shadowSize=type==='plate'?1+.18*progress:1-.1*progress;this.shadow.scale.setScalar(this.shadowSize)
  }
  atmosphere(firing=0,depth=0,heat=0,approach=0){
    const m=firingMaterial(firing),material=this.mesh.material
    this.firingUniform.value=m.pigmentMix;material.roughness=m.roughness;material.bumpScale=m.bumpScale;material.clearcoat=m.clearcoat;material.clearcoatRoughness=m.clearcoatRoughness;material.envMapIntensity=m.envIntensity
    material.color.set('#e5e1d9').lerp(new THREE.Color('#fff7ec'),firing*.55)
    const size=1-depth*.28;this.mesh.scale.setScalar(size);this.mesh.position.set(0,0,-depth*.8)
    this.shadow.position.z=-depth*.8;this.shadow.scale.setScalar(this.shadowSize*size)
    this.camera.zoom=1+approach;this.camera.updateProjectionMatrix()
    this.hemisphere.intensity=(2.1-.65*firing)*(1-depth*.78);this.key.intensity=(2.5-.25*firing)*(1-depth*.72)+heat*2.6;this.fill.intensity=(.6-.12*firing)*(1-depth*.55)
    this.key.color.set('#fff5e7').lerp(new THREE.Color('#e88439'),Math.min(1,depth*.45+heat*.55))
    this.canvas.dataset.firingProgress=String(firing);this.canvas.dataset.roughness=String(material.roughness);this.canvas.dataset.pigmentMix=String(m.pigmentMix);this.canvas.dataset.clearcoat=String(material.clearcoat)
  }
  /** One synchronous export using the existing renderer, mesh, pigment and angle. */
  capture(width=940,height=790){
    const out=document.createElement('canvas');out.width=width;out.height=height
    const ratio=this.renderer.getPixelRatio(),top=this.camera.top,bottom=this.camera.bottom
    try{
      this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false)
      this.camera.top=3.35*height/width/2;this.camera.bottom=-this.camera.top;this.camera.updateProjectionMatrix()
      this.renderer.render(this.scene,this.camera);out.getContext('2d')!.drawImage(this.canvas,0,0,width,height)
    }finally{
      this.renderer.setPixelRatio(ratio);this.renderer.setSize(this.width,this.height,false)
      this.camera.top=top;this.camera.bottom=bottom;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera)
    }
    return out
  }
  hit(x:number,y:number){this.scene.updateMatrixWorld(true);this.ray.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),this.camera);return this.ray.intersectObject(this.mesh,false).length>0}
  render(rotation:number){this.canvas.dataset.rotation=String(rotation);this.mesh.rotation.y=rotation;this.renderer.render(this.scene,this.camera)
    const box=new THREE.Box3().setFromObject(this.mesh),points=[]
    for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(this.camera);points.push({x:(p.x+1)/2,y:(1-p.y)/2})}
    this.canvas.dataset.bounds=JSON.stringify({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))})
    this.canvas.dataset.triangles=String(this.renderer.info.render.triangles)
  }
  dispose(){this.mesh.geometry.dispose();this.mesh.material.dispose();this.shadow.geometry.dispose();(this.shadow.material as THREE.Material).dispose();this.textures.forEach(t=>t.dispose());this.environment.dispose();this.renderer.dispose()}
}
