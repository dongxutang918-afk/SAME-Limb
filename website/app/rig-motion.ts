import * as T from 'three';

/** Illustrative walking, with the arms held across the chest as in the acquisition protocol. */
export function createWalkingPose(avatar:T.Object3D,skeleton:T.Skeleton){
 const bone=(n:string)=>{
  const b=skeleton.bones.find(x=>x.name.replace(/[^a-zA-Z0-9]/g,'')==='mixamorig'+n);
  if(!b)throw new Error('Missing anatomical rig bone: '+n);return b;
 };
 const qAvatar=new T.Quaternion(),qParent=new T.Quaternion();
 const point=(b:T.Bone,child:T.Bone,dir:T.Vector3)=>{
  avatar.getWorldQuaternion(qAvatar);b.parent!.getWorldQuaternion(qParent);
  b.quaternion.setFromUnitVectors(child.position.clone().normalize(),dir.clone().applyQuaternion(qAvatar).applyQuaternion(qParent.invert()).normalize());b.updateMatrixWorld(true);
 };
 const at=(b:T.Bone)=>avatar.worldToLocal(b.getWorldPosition(new T.Vector3()));
 const solve=(a:T.Bone,b:T.Bone,c:T.Bone,target:T.Vector3,pole:T.Vector3)=>{
  const start=at(a),l1=b.position.length(),l2=c.position.length(),delta=target.clone().sub(start);
  const distance=T.MathUtils.clamp(delta.length(),Math.abs(l1-l2)+.002,l1+l2-.003),dir=delta.normalize();
  const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const bend=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();
  const elbow=start.clone().addScaledVector(dir,along).addScaledVector(bend,height),end=start.clone().addScaledVector(dir,distance);
  point(a,b,elbow.sub(start));point(b,c,end.sub(at(b)));
 };
 const handFrame=(side:string,dir:T.Vector3)=>{
  const hand=bone(side+'Hand'),middle=bone(side+'HandMiddle1'),index=bone(side+'HandIndex1'),pinky=bone(side+'HandPinky1');
  const restY=middle.position.clone().normalize(),restX=index.position.clone().sub(pinky.position);restX.addScaledVector(restY,-restX.dot(restY)).normalize();
  const restZ=restX.clone().cross(restY).normalize(),newY=dir.normalize(),newX=newY.clone().cross(new T.Vector3(0,0,1)).normalize().multiplyScalar(side==='Left'?1:-1),newZ=newX.clone().cross(newY);
  const restQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(restX,restY,restZ));
  const newQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(newX,newY,newZ));
  avatar.getWorldQuaternion(qAvatar);hand.parent!.getWorldQuaternion(qParent);
  hand.quaternion.copy(qParent.invert()).multiply(qAvatar).multiply(newQ).multiply(restQ.invert());
 };
 return (phase:number)=>{
  const hips=bone('Hips');hips.position.y=.891+.007*Math.cos(phase*Math.PI*4);hips.rotation.y=.025*Math.sin(phase*Math.PI*2);hips.rotation.z=.009*Math.sin(phase*Math.PI*2);
  bone('Spine1').rotation.y=-hips.rotation.y*.65;bone('Spine2').rotation.x=0;bone('Head').rotation.x=-.015;
  avatar.updateMatrixWorld(true);
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1,p=(phase+(side==='Left'?0:.5))%1;
   const hip=bone(side+'UpLeg'),knee=bone(side+'Leg'),ankle=bone(side+'Foot'),toe=bone(side+'ToeBase'),h=at(hip);
   const stance=p<.62,u=stance?p/.62:(p-.62)/.38;
   const z=stance?.21-.42*u:-.21+.42*(u*u*(3-2*u));
   const y=.066+(stance?.003*Math.sin(Math.PI*u):.072*Math.sin(Math.PI*u));
   solve(hip,knee,ankle,new T.Vector3(h.x+sign*.047,y,z),new T.Vector3(0,0,1));
   point(ankle,toe,new T.Vector3(0,stance?-.045+.037*Math.cos(u*Math.PI):-.018,.139));
  }
  for(const side of ['Left','Right']){
   const sign=side==='Left'?1:-1,arm=bone(side+'Arm'),fore=bone(side+'ForeArm'),hand=bone(side+'Hand');
   const chestY=at(bone('Spine2')).y;
   solve(arm,fore,hand,new T.Vector3(-sign*.050,chestY+.018+(side==='Left'?.028:0),side==='Left'?.175:.136),new T.Vector3(sign*.16,-.23,.13));
   handFrame(side,new T.Vector3(-sign*.89,.42,-.17));
   hand.updateMatrixWorld(true);
   // Bring the spread neutral fingers together and gently curve them onto the opposite upper arm.
   for(const [i,digit] of ['Index','Middle','Ring','Pinky'].entries()){
    const first=bone(side+'Hand'+digit+'1'),second=bone(side+'Hand'+digit+'2'),third=bone(side+'Hand'+digit+'3');
    point(first,second,new T.Vector3(-sign*.92,.28+(i-1.5)*.055,-.25));
    point(second,third,new T.Vector3(-sign*.85,.16,-.42));
    third.quaternion.identity();
   }
   const thumb1=bone(side+'HandThumb1'),thumb2=bone(side+'HandThumb2'),thumb3=bone(side+'HandThumb3');
   point(thumb1,thumb2,new T.Vector3(-sign*.60,.50,-.19));
   point(thumb2,thumb3,new T.Vector3(-sign*.86,.30,-.15));thumb3.quaternion.identity();
  }
  avatar.updateMatrixWorld(true);skeleton.update();
 };
}
