import * as T from 'three';
import {jointDefinitions,type JointId} from './mocap-definitions';

/** Marker vectors stay attached to the posed body; they do not use exploded sensor positions. */
export function createMocapOverlay(root:T.Group,markers:T.Mesh[],labels:(HTMLButtonElement|null)[],pointLabels:(HTMLSpanElement|null)[],camera:T.Camera,host:HTMLDivElement){
 const overlay=new T.Group();overlay.name='SI Table S6 marker geometry';root.add(overlay);
 const cylinder=new T.CylinderGeometry(.002,.002,1,8),sphere=new T.SphereGeometry(.010,16,12);
 const up=new T.Vector3(0,1,0),direction=new T.Vector3(),screen=new T.Vector3(),u=new T.Vector3(),v=new T.Vector3(),tangent=new T.Vector3(),point=new T.Vector3();
 let selected:JointId|null=null;
 const groups=jointDefinitions.map(def=>{
  const group=new T.Group();overlay.add(group);
  const material=new T.MeshBasicMaterial({color:0x55c9f2,transparent:true,opacity:.9,depthTest:false,depthWrite:false});
  const rods=[0,1].map(()=>{const mesh=new T.Mesh(cylinder,material);mesh.renderOrder=9;group.add(mesh);return mesh;});
  const highlights=def.indices.map(()=>{const mesh=new T.Mesh(sphere,material);mesh.renderOrder=10;group.add(mesh);return mesh;});
  const arcGeometry=new T.BufferGeometry();arcGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(33*3),3));
  const arc=new T.Line(arcGeometry,new T.LineBasicMaterial({color:0xe4f9ff,transparent:true,depthTest:false,depthWrite:false}));arc.renderOrder=11;arc.frustumCulled=false;group.add(arc);
  return{def,group,material,rods,highlights,arc};
 });
 return{
  select:(id:JointId|null)=>{selected=id;},
  update:()=>{
   overlay.visible=selected!==null;
   pointLabels.forEach(label=>{if(label)label.hidden=selected===null;});
   groups.forEach(({def,group,material,rods,highlights,arc},i)=>{
    const label=labels[i];if(label)label.hidden=selected===null;
    if(!selected)return;
    const active=selected===def.id;
    material.opacity=active?.96:.17;group.visible=true;
    const [a,b,c]=def.indices.map(index=>markers[index].position);
    [a,c].forEach((end,j)=>{direction.copy(end).sub(b);rods[j].position.copy(b).add(end).multiplyScalar(.5);rods[j].scale.y=direction.length();rods[j].quaternion.setFromUnitVectors(up,direction.normalize());});
    highlights.forEach((mesh,j)=>{mesh.position.copy(markers[def.indices[j]].position);mesh.visible=active;});
    if(active)def.indices.forEach((index,j)=>{const label=pointLabels[j];if(!label)return;screen.copy(markers[index].position);root.localToWorld(screen);screen.project(camera);label.style.left=((screen.x*.5+.5)*host.clientWidth+14)+'px';label.style.top=((-screen.y*.5+.5)*host.clientHeight-21)+'px';});
    u.copy(a).sub(b).normalize();v.copy(c).sub(b).normalize();
    const dot=T.MathUtils.clamp(u.dot(v),-1,1),theta=Math.acos(dot);
    tangent.copy(v).addScaledVector(u,-dot);arc.visible=active&&tangent.lengthSq()>1e-10;tangent.normalize();
    const attr=arc.geometry.getAttribute('position');
    for(let k=0;k<=32;k++){const t=theta*k/32;point.copy(b).addScaledVector(u,.045*Math.cos(t)).addScaledVector(tangent,.045*Math.sin(t));attr.setXYZ(k,point.x,point.y,point.z);}attr.needsUpdate=true;
    if(label){screen.copy(b);root.localToWorld(screen);screen.project(camera);label.style.left=((screen.x*.5+.5)*host.clientWidth+(def.id.startsWith('left')?58:-65))+'px';label.style.top=((-screen.y*.5+.5)*host.clientHeight+(def.id.includes('ankle')?12:-5))+'px';}
   });
  }
 };
}
