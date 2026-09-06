import * as T from 'three';

/** A local selection cue, without bloom or changing other devices' materials. */
export function createSensorFocus() {
 const size=64,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));
  const alpha=Math.exp(-radius*radius*3.5)*Math.pow(Math.max(0,1-radius),.8);
  const index=(y*size+x)*4;
  pixels[index]=pixels[index+1]=pixels[index+2]=255;pixels[index+3]=Math.round(alpha*255);
 }
 const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);
 texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
 return {
  attach(device:T.Group,color:string,isEmg:boolean){
   const materials=new Map<T.MeshStandardMaterial,{material:T.MeshStandardMaterial;emissive:T.Color;intensity:number}>();
   device.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const isolate=(source:T.Material)=>{
     if(!(source instanceof T.MeshStandardMaterial))return source;
     if(!materials.has(source))materials.set(source,{material:source.clone(),emissive:source.emissive.clone(),intensity:source.emissiveIntensity});
     return materials.get(source)!.material;
    };
    object.material=Array.isArray(object.material)?object.material.map(isolate):isolate(object.material);
   });
   const accent=new T.Color(color).lerp(new T.Color('#fff0ee'),.4);
   const glow=new T.Sprite(new T.SpriteMaterial({map:texture,color:accent,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
   glow.name='Selected sensor glow';glow.position.set(isEmg?0:.002,0,isEmg?.007:.001);
   glow.scale.setScalar(isEmg?.15:.095);glow.visible=false;
   // Keep the surrounding glow out of sensor hit testing.
   glow.raycast=()=>{};device.add(glow);
   let level=0;
   return {
    update(target:number,dt:number,reducedMotion:boolean){
     const before=level;
     level+=(T.MathUtils.clamp(target,0,1)-level)*(reducedMotion?1:1-Math.exp(-Math.max(0,dt)*12));
     if(Math.abs(target-level)<.001)level=target;
     const scale=1+level*(isEmg?1.2:4);
     device.scale.setScalar(scale);
     // Keep the halo legible without letting it engulf neighboring sensors.
     glow.scale.setScalar((isEmg?.15:.095)/scale);
     glow.visible=level>.001;glow.material.opacity=level;
     materials.forEach(({material,emissive,intensity})=>{
      material.emissive.copy(emissive).lerp(accent,level);
      material.emissiveIntensity=T.MathUtils.lerp(intensity,.85,level);
     });
     return Math.abs(before-level)>.0001;
    },
   };
  },
  dispose(){texture.dispose();},
 };
}
