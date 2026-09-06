import {assetUrl} from './asset-path';
import * as T from 'three';
import {createWalkingPose} from './rig-motion';
import {createMocapOverlay} from './mocap-overlay';
import {createSensorFocus} from './sensor-focus';
import {amgPlacement} from './sensor-layout';
import type {JointId} from './mocap-definitions';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Selection={site:number;sensor:number}|null;
export type RunnerAPI={expand:(v:boolean)=>void;mocap:(joint:JointId|null)=>void;reset:()=>void;play:(v:boolean)=>void;dispose:()=>void};
type Callbacks={onExpand:(v:boolean)=>void;onSelect:(v:Selection)=>void;onReady:()=>void;getSelected:()=>Selection;onMarker?:(name:string|null)=>void};
const colors=['#b93c57','#dc6471','#ce5e7b','#9e2f4b'];
const boneNames=['LeftUpLeg','LeftUpLeg','LeftLeg','LeftLeg'];
const anchors=[[.119,.681,.121],[.105,.523,.090],[.190,.321,.060],[.185,.352,-.071]];
const V=(a:readonly number[])=>new T.Vector3(a[0],a[1],a[2]);

export async function createRunner(host:HTMLDivElement,pins:(HTMLButtonElement|null)[],callbacks:Callbacks,jointPins:(HTMLButtonElement|null)[],pointLabels:(HTMLSpanElement|null)[]):Promise<RunnerAPI>{
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.domElement.setAttribute('aria-label','A walking participant with arms crossed over the chest, transparent left-leg skin, four muscle sites, wearable sensors, and 15 optical markers');
 host.appendChild(renderer.domElement);
 const scene=new T.Scene(),root=new T.Group();scene.add(root);
 const camera=new T.PerspectiveCamera(32,1,.05,30);camera.position.set(2.15,1.30,3.15);camera.lookAt(0,.86,.035);
 scene.add(new T.HemisphereLight(0xe3ecfa,0x151720,2.25));
 const key=new T.DirectionalLight(0xfff2e6,3.1);key.position.set(-2,4,4);scene.add(key);
 const rim=new T.DirectionalLight(0x8fb9e8,3.5);rim.position.set(3,3,-3);scene.add(rim);
 const front=new T.DirectionalLight(0xe9f4ff,1.5);front.position.set(1,1,4);scene.add(front);
 let gltf;
 try{gltf=await new GLTFLoader().loadAsync(assetUrl('/assets/anatomy/runner-body.glb'));}
 catch(error){renderer.dispose();renderer.domElement.remove();throw error;}
 const avatar=gltf.scene;root.add(avatar);avatar.rotation.x=.018;avatar.position.z=-.10;
 const body=avatar.getObjectByName('Body') as T.SkinnedMesh;
 const skeleton=body.skeleton;
 const bone=(n:string)=>{
  const found=skeleton.bones.find(b=>b.name.replace(/[^a-zA-Z0-9]/g,'')==='mixamorig'+n);
  if(!found)throw new Error('Missing rig bone: '+n);
  return found;
 };
 const bindInverse=new Map(skeleton.bones.map((b,i)=>[b.name,skeleton.boneInverses[i].clone()]));
 const bindMatrix=body.bindMatrix.clone();
 const skinMat=new T.MeshPhysicalMaterial({color:0xb5bfca,metalness:.12,roughness:.48,clearcoat:.12});
 const glassMat=new T.MeshPhysicalMaterial({color:0xcee4ef,metalness:.04,roughness:.21,transparent:true,opacity:.16,depthWrite:false,side:T.FrontSide,clearcoat:.8});
 // Fragment-level boundaries give the shorts and transparent skin clean edges,
 // independent of the triangulation of the human mesh.
 const anatomyShader=(material:T.MeshPhysicalMaterial,transparentLeg:boolean)=>{
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vAnatomyPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAnatomyPosition=position;');
   shader.fragmentShader='varying vec3 vAnatomyPosition;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    bool leftLeg=vAnatomyPosition.x>0.025 && vAnatomyPosition.y<0.79;
    ${transparentLeg?'if(!leftLeg) discard;':'if(leftLeg) discard; if(vAnatomyPosition.y>=0.79 && vAnatomyPosition.y<0.985 && abs(vAnatomyPosition.x)<0.26) diffuseColor.rgb=vec3(0.008,0.015,0.024);'}
   `);
  };
  material.customProgramCacheKey=()=>transparentLeg?'anatomy-glass':'anatomy-solid';
 };
 anatomyShader(skinMat,false);anatomyShader(glassMat,true);
 const sourceGeometry=body.geometry;
 const splitMesh=(material:T.Material,name:string,order:number)=>{
  const geometry=sourceGeometry.clone();geometry.computeBoundingSphere();
  const mesh=new T.SkinnedMesh(geometry,material);mesh.name=name;mesh.bind(skeleton,bindMatrix);mesh.frustumCulled=false;mesh.renderOrder=order;
  avatar.add(mesh);return mesh;
 };
 const opaqueBody=splitMesh(skinMat,'Anatomical body',0);
 const skinShell=splitMesh(glassMat,'Transparent left-leg skin',4);
 body.visible=false;
 for(const name of ['Eyes','Teeth','Tongue']){
  const mesh=avatar.getObjectByName(name) as T.Mesh;
  if(mesh)mesh.material=new T.MeshStandardMaterial({color:name==='Eyes'?0x75838b:name==='Teeth'?0xdeddda:0x84737a,roughness:.55,metalness:.03});
 }
 const skinWeights=(geometry:T.BufferGeometry)=>{
  const pos=geometry.getAttribute('position'),indices:number[]=[],weights:number[]=[];
  const up=skeleton.bones.indexOf(bone('LeftUpLeg')),low=skeleton.bones.indexOf(bone('LeftLeg')),foot=skeleton.bones.indexOf(bone('LeftFoot'));
  for(let i=0;i<pos.count;i++){
   const y=pos.getY(i),upper=T.MathUtils.smoothstep(y,.42,.49);
   const footWeight=1-T.MathUtils.smoothstep(y,.065,.11);
   indices.push(up,low,foot,0);weights.push(upper*(1-footWeight),(1-upper)*(1-footWeight),footWeight,0);
  }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 };
 const makeSkinned=(geometry:T.BufferGeometry,material:T.Material,site:number,name:string)=>{
  skinWeights(geometry);const mesh=new T.SkinnedMesh(geometry,material);mesh.name=name;mesh.bind(skeleton,bindMatrix);mesh.frustumCulled=false;mesh.userData={site,sensor:4};mesh.renderOrder=2;avatar.add(mesh);return mesh;
 };
 const muscleMeshes:T.SkinnedMesh[]=[];
 // Anatomically placed, fusiform volumes, with tendon transitions and longitudinal fascicles.
 const makeMuscle=(points:number[][],width:number,depth:number,peak:number,site:number,name:string)=>{
  const curve=new T.CatmullRomCurve3(points.map(V)),verts:number[]=[],normals:number[]=[],cols:number[]=[],faces:number[]=[];
  const n=56,sides=28,frames=curve.computeFrenetFrames(n,false);
  const red=new T.Color(colors[site]),tendon=new T.Color('#d0b5b2');
  const shape=(t:number)=>Math.max(.045,Math.pow(Math.sin(Math.PI*Math.pow(t,peak)),.7));
  for(let i=0;i<=n;i++){
   const t=i/n,p=curve.getPoint(t),normal=frames.normals[i],binormal=frames.binormals[i],bulge=shape(t);
   const tint=red.clone().lerp(tendon,Math.max(0,(Math.abs(t-.5)-.35)/.15));
   for(let j=0;j<=sides;j++){
    const angle=j/sides*Math.PI*2,radial=normal.clone().multiplyScalar(Math.cos(angle)*width*bulge).addScaledVector(binormal,Math.sin(angle)*depth*bulge);
    const q=p.clone().add(radial);verts.push(q.x,q.y,q.z);normals.push(radial.x,radial.y,radial.z);cols.push(tint.r,tint.g,tint.b);
    if(i<n&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;faces.push(a,b,a+1,b,b+1,a+1);}
   }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setIndex(faces);geo.computeVertexNormals();
  const material=new T.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.41,metalness:.02,clearcoat:.22,side:T.DoubleSide});
  const mesh=makeSkinned(geo,material,site,name);muscleMeshes.push(mesh);
  const fp:number[]=[],fi:number[]=[];
  for(let j=0;j<22;j++){
   const a=j/22*Math.PI*2,start=fp.length/3;
   for(let i=0;i<=n;i++){
    const t=i/n,p=curve.getPoint(t),bulge=shape(t)*1.008;
    for(const shift of [-.014,.014]){
     const q=p.clone().addScaledVector(frames.normals[i],Math.cos(a+shift)*width*bulge).addScaledVector(frames.binormals[i],Math.sin(a+shift)*depth*bulge);
     fp.push(q.x,q.y,q.z);
    }
    if(i<n){const q=start+i*2;fi.push(q,q+2,q+1,q+1,q+2,q+3);}
   }
  }
  const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(fp,3));fg.setIndex(fi);fg.computeVertexNormals();
  makeSkinned(fg,new T.MeshStandardMaterial({color:0xf4c0c3,roughness:.55,transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide}),site,name+' fascicles');
 };
 makeMuscle([[.103,.83,.051],[.117,.71,.083],[.139,.574,.064],[.154,.46,.046]],.025,.019,1,0,'Rectus femoris');
 makeMuscle([[.070,.718,.031],[.084,.617,.056],[.105,.529,.063],[.150,.447,.044]],.029,.021,1.55,1,'Vastus medialis');
 makeMuscle([[.173,.431,.042],[.190,.332,.042],[.209,.219,.031],[.220,.104,.024]],.014,.011,.72,2,'Tibialis anterior');
 makeMuscle([[.157,.425,-.026],[.164,.362,-.048],[.186,.276,-.042],[.211,.14,-.024]],.023,.020,.7,3,'Gastrocnemius medial head');
 makeMuscle([[.197,.425,-.019],[.205,.356,-.036],[.201,.276,-.035],[.211,.14,-.024]],.019,.018,.7,3,'Gastrocnemius lateral head');

 const black=new T.MeshStandardMaterial({color:0x11171d,roughness:.42,metalness:.10});
 const silver=new T.MeshStandardMaterial({color:0xcbd3d7,metalness:.88,roughness:.27});
 const green=new T.MeshStandardMaterial({color:0x16734c,roughness:.6,metalness:.12});
 const gold=new T.MeshStandardMaterial({color:0xcbb16c,metalness:.8,roughness:.32});
 const blue=new T.MeshStandardMaterial({color:0x417faa,roughness:.7});
 const white=new T.MeshStandardMaterial({color:0xcfd5d9,roughness:.8});
 const addBox=(g:T.Group,dimensions:number[],mat:T.Material,xyz:number[],radius=.0005)=>{
  const mesh=new T.Mesh(new RoundedBoxGeometry(dimensions[0],dimensions[1],dimensions[2],2,radius),mat);mesh.position.copy(V(xyz));g.add(mesh);return mesh;
 };
 const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=512;
 const ctx=labelCanvas.getContext('2d')!;ctx.fillStyle='#23834c';ctx.fillRect(0,0,256,512);ctx.strokeStyle='#a3d2b3';ctx.lineWidth=5;ctx.strokeRect(12,14,232,484);
 ctx.fillStyle='#ecf6ed';ctx.font='30px Arial';ctx.fillText('DataLITE',50,72);ctx.font='bold 39px Arial';ctx.fillText('EMG',77,135);
 ctx.beginPath();ctx.arc(128,253,31,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eaf7ef';ctx.lineWidth=3;ctx.beginPath();ctx.arc(128,355,24,0,Math.PI*2);ctx.stroke();
 const labelTexture=new T.CanvasTexture(labelCanvas);labelTexture.colorSpace=T.SRGBColorSpace;
 const panelMat=new T.MeshStandardMaterial({map:labelTexture,roughness:.55,metalness:.03});
 const emgDevice=()=>{
  const g=new T.Group();g.name='LE230 — 42 × 24 × 14 mm';
  addBox(g,[.024,.042,.014],black,[0,0,.007],.0021);
  addBox(g,[.0205,.0375,.0006],green,[0,0,.0141],.001);
  const face=new T.Mesh(new T.PlaneGeometry(.020,.037),panelMat);face.position.z=.01445;g.add(face);
  for(const y of [-.01,.01]){const disk=new T.Mesh(new T.CylinderGeometry(.005,.005,.0018,24),silver);disk.rotation.x=Math.PI/2;disk.position.set(0,y,-.0005);g.add(disk);}
  return g;
 };
 const amgDevice=()=>{
  const g=new T.Group();g.name='Custom AMG module — approximately 6 × 5 mm PCB';
  addBox(g,[.006,.005,.0007],green,[0,0,.0005],.00025);
  addBox(g,[.002,.002,.00093],black,[-.0003,0,.00131],.00015);
  for(let j=0;j<3;j++)for(const side of [-1,1])addBox(g,[.0005,.00055,.00015],gold,[side*.00125,-.00065+j*.00065,.00094],.00002);
  addBox(g,[.0011,.0034,.0011],white,[.0026,0,.00115],.0001);
  const sleeve=new T.Mesh(new T.CylinderGeometry(.00055,.00055,.005,10),blue);sleeve.rotation.z=Math.PI/2;sleeve.position.set(.006,0,.001);g.add(sleeve);
  return g;
 };
 const sensorFocus=createSensorFocus();
 const clusters=anchors.map((a,i)=>{
  const g=new T.Group();root.add(g);
  const devices=[amgDevice(),amgDevice(),amgDevice(),amgDevice(),emgDevice()];
  const mounts=[...amgPlacement.map(p=>V(p.mount)),new T.Vector3()];
  const explodedMounts=[...amgPlacement.map(p=>V(p.exploded)),new T.Vector3(0,0,.018)];
  devices.forEach((d,j)=>{d.position.copy(mounts[j]);d.traverse(o=>o.userData={site:i,sensor:j});g.add(d);});
  const focus=devices.map((d,j)=>sensorFocus.attach(d,colors[i],j===4));
  const wires=devices.slice(0,4).map((d,j)=>{
   const material=white.clone();const mesh=new T.Mesh(new T.BufferGeometry(),material);mesh.userData={site:i,sensor:j};g.add(mesh);return mesh;
  });
  const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineDashedMaterial({color:colors[i],transparent:true,opacity:0,dashSize:.012,gapSize:.011}));
  root.add(line);
  const targetBone=bone(boneNames[i]),anchor=V(a).applyMatrix4(bindInverse.get(targetBone.name)!);
  const offset=V([[.34,.13,.07],[-.36,.06,.18],[.36,-.035,.19],[-.31,-.24,.25]][i]);
  const poseQuat=new T.Quaternion().setFromEuler(new T.Euler(0,i===3?Math.PI:i===1?-.25:.05,0));
  return{group:g,devices,focus,mounts,explodedMounts,wires,line,bone:targetBone,anchor,offset,poseQuat,lastAmount:-1};
 });
 // Each device now owns its highlighted materials; release the construction templates.
 [black,silver,green,gold,blue,white,panelMat].forEach(material=>material.dispose());


 // Ten angle-construction landmarks follow SI Table S6. Five additional markers
 // complete the 15-marker acquisition layout; their 3D positions are schematic.
 const markerDefinitions:[string,string,number[]][]=[
  ['L.Thigh','LeftUpLeg',[.193,.69,.02]],['L.Knee','LeftLeg',[.218,.453,.024]],['L.Shank','LeftLeg',[.245,.295,.012]],['L.Ankle','LeftFoot',[.25,.086,.025]],['Left foot reference','LeftFoot',[.217,.050,-.047]],['L.Toe','LeftToeBase',[.220,.036,.174]],
  ['Left pelvic reference','Hips',[.135,.94,.105]],['Posterior pelvic reference','Hips',[0,.965,-.125]],['Right pelvic reference','Hips',[-.135,.94,.105]],
  ['R.Thigh','RightUpLeg',[-.193,.69,.02]],['R.Knee','RightLeg',[-.218,.453,.024]],['R.Shank','RightLeg',[-.245,.295,.012]],['R.Ankle','RightFoot',[-.25,.086,.025]],['Right foot reference','RightFoot',[-.217,.050,-.047]],['R.Toe','RightToeBase',[-.220,.036,.174]]
 ];
 const markerMaterial=new T.MeshStandardMaterial({color:0xecfaff,metalness:.5,roughness:.26,emissive:0x55adcd,emissiveIntensity:.35});
 const markerGeometry=new T.SphereGeometry(.007,16,12);
 const markers=markerDefinitions.map(([name,bn,p])=>{const b=bone(bn),mesh=new T.Mesh(markerGeometry,markerMaterial);mesh.userData={marker:name};root.add(mesh);return{mesh,bone:b,anchor:V(p).applyMatrix4(bindInverse.get(b.name)!)};});
 const markerOverlay=createMocapOverlay(root,markers.map(m=>m.mesh),jointPins,pointLabels,camera,host);
 let selectedJoint:JointId|null=null;

 const ringMat=new T.MeshBasicMaterial({color:0x61809e,transparent:true,opacity:.23,side:T.DoubleSide});
 for(const radius of [.36,.53]){
  const ring=new T.Mesh(new T.RingGeometry(radius,radius+.0015,96),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=-.003;root.add(ring);
 }
 const groundTex=document.createElement('canvas');groundTex.width=128;groundTex.height=128;const gx=groundTex.getContext('2d')!;
 const gr=gx.createRadialGradient(64,64,5,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.8)');gr.addColorStop(1,'rgba(0,0,0,0)');gx.fillStyle=gr;gx.fillRect(0,0,128,128);
 const shadowTexture=new T.CanvasTexture(groundTex),shadow=new T.Mesh(new T.PlaneGeometry(1.35,.85),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.001;root.add(shadow);
 const pose=createWalkingPose(avatar,skeleton);

 let amount=0,target=0,phase=.80,rotation=0,tilt=0,isPlaying=true,frame=0,last=performance.now(),visible=true,disposed=false,collapseTimer=0;
 const cancelCollapse=()=>{window.clearTimeout(collapseTimer);collapseTimer=0;};
 let dragging=false,moved=false,dragX=0,dragY=0,startX=0,startY=0,downTarget=0;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),ray=new T.Raycaster(),pointer=new T.Vector2(),projected=new T.Vector3(),anchorPos=new T.Vector3();
 const baseQuat=new T.Quaternion(),rootQuat=new T.Quaternion(),wantedQuat=new T.Quaternion();
 const handleMove=(e:PointerEvent)=>{
  if(dragging){const dx=e.clientX-dragX,dy=e.clientY-dragY;rotation+=dx*.008;tilt=T.MathUtils.clamp(tilt+dy*.004,-.25,.25);dragX=e.clientX;dragY=e.clientY;if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved=true;return;}
  if(e.pointerType==='touch')return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
  const candidates=[opaqueBody,skinShell,...muscleMeshes,...clusters.flatMap(c=>c.devices),...markers.map(m=>m.mesh)];
  const hits=ray.intersectObjects(candidates,true);
  if(hits.length){
   cancelCollapse();
   if(!selectedJoint&&!target){target=1;callbacks.onExpand(true);}
   const u=hits[0].object.userData;callbacks.onMarker?.(u.marker??null);
   if(!selectedJoint&&typeof u.site==='number'){const sel=callbacks.getSelected();if(!sel||sel.site!==u.site||sel.sensor!==u.sensor)callbacks.onSelect({site:u.site,sensor:u.sensor});}
   renderer.domElement.style.cursor='pointer';
  }else{
   callbacks.onMarker?.(null);renderer.domElement.style.cursor='grab';
  }
 };
 const handleDown=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;moved=false;dragX=startX=e.clientX;dragY=startY=e.clientY;downTarget=target;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';};
 const handleUp=(e:PointerEvent)=>{if(!dragging)return;dragging=false;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);renderer.domElement.style.cursor='grab';if(e.pointerType==='touch'&&!moved&&!selectedJoint){target=downTarget?0:1;callbacks.onExpand(!!target);if(!target)callbacks.onSelect(null);}};
 const handleKey=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotation+=e.key==='ArrowLeft'?-.2:.2;}if(e.key==='Home'){e.preventDefault();rotation=0;tilt=0;}};
 renderer.domElement.tabIndex=0;renderer.domElement.style.touchAction='pan-y';
 renderer.domElement.addEventListener('pointermove',handleMove);renderer.domElement.addEventListener('pointerdown',handleDown);renderer.domElement.addEventListener('pointerup',handleUp);renderer.domElement.addEventListener('pointercancel',handleUp);renderer.domElement.addEventListener('keydown',handleKey);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
 const intersection=new IntersectionObserver(e=>visible=e[0].isIntersecting);intersection.observe(host);
 const animate=(time:number)=>{
  if(disposed)return;frame=requestAnimationFrame(animate);
  const dt=Math.min(.04,(time-last)/1000);last=time;if(!visible||document.hidden)return;
  const smoothing=reduce.matches?1:1-Math.exp(-dt*6);
  amount+=(target-amount)*smoothing;if(Math.abs(target-amount)<.003)amount=target;
  root.rotation.y+=(rotation-root.rotation.y)*smoothing;if(Math.abs(rotation-root.rotation.y)<.003)root.rotation.y=rotation;
  if(isPlaying&&!reduce.matches)phase=(phase+dt*.76*(selectedJoint?1:Math.max(0,1-amount*6)))%1;
  root.rotation.x+=(tilt-root.rotation.x)*smoothing;
  pose(phase);root.updateMatrixWorld(true);root.getWorldQuaternion(rootQuat);
  const selected=selectedJoint||!target?null:callbacks.getSelected();
  clusters.forEach((c,i)=>{
   anchorPos.copy(c.anchor).applyMatrix4(c.bone.matrixWorld);root.worldToLocal(anchorPos);
   c.group.position.copy(anchorPos).addScaledVector(c.offset,amount);
   c.bone.getWorldQuaternion(baseQuat);baseQuat.premultiply(rootQuat.clone().invert()).multiply(c.poseQuat);
   wantedQuat.setFromEuler(new T.Euler(-.08,.28,0));c.group.quaternion.copy(baseQuat).slerp(wantedQuat,amount);
   let focusChanged=false;
   c.devices.forEach((d,j)=>{
    d.position.lerpVectors(c.mounts[j],c.explodedMounts[j],amount);
    focusChanged=c.focus[j].update(selected?.site===i&&selected.sensor===j?amount:0,dt,reduce.matches)||focusChanged;
   });
   if(Math.abs(c.lastAmount-amount)>.005||focusChanged){
    c.wires.forEach((w,j)=>{
     const start=new T.Vector3(.009,0,.001).multiply(c.devices[j].scale).add(c.devices[j].position);
     const end=new T.Vector3(.085,.075,-.008),mid=start.clone().lerp(end,.55);mid.z+=.016;
     const curve=new T.CatmullRomCurve3([start,mid,end]);w.geometry.dispose();w.geometry=new T.TubeGeometry(curve,16,.00034,5,false);
    });c.lastAmount=amount;
   }
   const attr=c.line.geometry.getAttribute('position');attr.setXYZ(0,anchorPos.x,anchorPos.y,anchorPos.z);attr.setXYZ(1,c.group.position.x,c.group.position.y,c.group.position.z);attr.needsUpdate=true;c.line.computeLineDistances();c.line.material.opacity=amount*.5;
   const button=pins[i];
   if(button){c.group.getWorldPosition(projected);projected.y+=.048+.048*amount;projected.project(camera);const shiftX=[42,-45,42,-42][i]*(1-amount);button.style.left=((projected.x*.5+.5)*host.clientWidth+shiftX)+'px';button.style.top=((-projected.y*.5+.5)*host.clientHeight)+'px';}
  });
  markers.forEach(m=>{m.mesh.position.copy(m.anchor).applyMatrix4(m.bone.matrixWorld);root.worldToLocal(m.mesh.position);});
  markerOverlay.update();
  renderer.render(scene,camera);
 };
 pose(phase);frame=requestAnimationFrame(animate);callbacks.onReady();
 return{
  expand:v=>{cancelCollapse();target=v&&!selectedJoint?1:0;callbacks.onExpand(!!target);},play:v=>{isPlaying=v;},
  mocap:joint=>{
   cancelCollapse();selectedJoint=joint;markerOverlay.select(joint);target=0;
   if(joint){
    // Joint geometry is shown with every sensor at its attached, physical scale.
    amount=0;clusters.forEach(cluster=>cluster.focus.forEach(focus=>focus.update(0,0,true)));
   }
   callbacks.onExpand(false);callbacks.onSelect(null);
  },
  reset:()=>{rotation=0;tilt=0;phase=.15;target=0;isPlaying=true;callbacks.onExpand(false);callbacks.onSelect(null);},
  dispose:()=>{disposed=true;cancelCollapse();cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();renderer.domElement.removeEventListener('pointermove',handleMove);renderer.domElement.removeEventListener('pointerdown',handleDown);renderer.domElement.removeEventListener('pointerup',handleUp);renderer.domElement.removeEventListener('pointercancel',handleUp);renderer.domElement.removeEventListener('keydown',handleKey);
   const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
   scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>materials.add(x));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());sensorFocus.dispose();labelTexture.dispose();shadowTexture.dispose();renderer.dispose();renderer.domElement.remove();
  }
 };
}

