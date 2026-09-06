/* oxlint-disable next/no-img-element -- Local assets must work in the standalone static export without an image server. */
'use client';
import {assetUrl} from './asset-path';
import { useEffect, useRef, useState } from 'react';
import {  Expand, Minus, MousePointer2, ScanLine, X, Play, Pause, ArrowUpRight } from 'lucide-react';
import type { RunnerAPI, Selection } from './runner-engine';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {jointDefinitions,type JointId,type SceneMode} from './mocap-definitions';

export const sites = [
 {id:'RF',name:'Rectus femoris',area:'Anterior thigh',detail:'Four triaxial AMG modules and one surface EMG sensor sample the mechanical and electrical activity around the rectus femoris.',color:'#df7381'},
 {id:'VM',name:'Vastus medialis',area:'Medial thigh, above the knee',detail:'The vastus medialis site pairs local mechanical vibration with surface electrical activity on the inner front of the thigh.',color:'#f4a0a2'},
 {id:'TA',name:'Tibialis anterior',area:'Anterior lower leg',detail:'Four AMG modules preserve X, Y, and Z at the tibialis anterior: 12 mechanical signal axes, paired with one EMG channel.',color:'#ee9aab'},
 {id:'GA',name:'Gastrocnemius',area:'Posterior calf',detail:'The gastrocnemius is recorded in synchrony with the other three sites. Drag the model to see the sensors on the back of the calf.',color:'#c9536f'},
];
export default function SensorScene({mode,onModeChange}:{mode:SceneMode;onModeChange:(mode:SceneMode)=>void}) {
 const host=useRef<HTMLDivElement>(null),pins=useRef<(HTMLButtonElement|null)[]>([]),jointPins=useRef<(HTMLButtonElement|null)[]>([]),pointLabels=useRef<(HTMLSpanElement|null)[]>([]),api=useRef<RunnerAPI|null>(null);
 const [expanded,setExpanded]=useState(false),[selected,setSelected]=useState<Selection>(null),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[playing,setPlaying]=useState(true);
 const [pinned,setPinned]=useState(false),[marker,setMarker]=useState<string|null>(null);
 const [joint,setJoint]=useState<JointId>('left_knee');
 const selectedRef=useRef<Selection>(null),leaveTimer=useRef(0),pinnedRef=useRef(false);
 const pin=()=>{clearTimeout(leaveTimer.current);pinnedRef.current=true;setPinned(true);};
 const choose=(s:Selection)=>{if(s)clearTimeout(leaveTimer.current);else{pinnedRef.current=false;setPinned(false);}selectedRef.current=s;setSelected(s);};
 const expand=(v:boolean)=>{clearTimeout(leaveTimer.current);setExpanded(v);api.current?.expand(v);if(!v)choose(null);};
 useEffect(()=>{
  let cancelled=false;
  import('./runner-engine').then(({createRunner})=>{
   if(cancelled||!host.current)return;
   return createRunner(host.current,pins.current,{onExpand:setExpanded,onSelect:choose,onReady:()=>{if(!cancelled)setReady(true);},getSelected:()=>selectedRef.current,onMarker:setMarker},jointPins.current,pointLabels.current);
  }).then(instance=>{if(!instance)return;if(cancelled)instance.dispose();else api.current=instance;}).catch(error=>{console.error('Runner scene unavailable',error);if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;clearTimeout(leaveTimer.current);api.current?.dispose();api.current=null;};
 },[]);
 useEffect(()=>{clearTimeout(leaveTimer.current);if(ready)api.current?.mocap(mode==='mocap'?joint:null);},[mode,joint,ready]);
 const site=selected?sites[selected.site]:null,isEmg=selected?.sensor===4;
 const activeJoint=jointDefinitions.find(d=>d.id===joint)!;
 return <div className={'sensor-experience '+(expanded?'is-expanded':'')+(mode==='mocap'?' mocap-mode':'')} onPointerEnter={()=>clearTimeout(leaveTimer.current)} onPointerLeave={e=>{if(mode==='sensors'&&e.pointerType!=='touch'&&!pinnedRef.current)leaveTimer.current=window.setTimeout(()=>expand(false),400);}}>
  <div className="scene-aura"/><div className="scene-corner"><span className="live-dot"/> SENSING & OPTICAL MOTION CAPTURE</div>
  <div ref={host} className="scene-host">
   {!ready&&!failed&&<div className="scene-loading"><span/>Loading the sensing system</div>}
   {failed&&<div className="scene-fallback"><img src={assetUrl('/assets/paper-overview.png')} alt="Paper Figure 1: the actual sensor placement on four left-leg muscle sites"/><p>3D is unavailable in this browser. Select a muscle below to explore its sensors.</p></div>}
   {ready&&sites.map((s,i)=><button hidden={mode==='mocap'} key={s.id} ref={el=>{pins.current[i]=el;}} className={'sensor-pin pin-'+i+(selected?.site===i?' active':'')} style={{'--sensor-color':s.color} as React.CSSProperties} onPointerEnter={()=>{expand(true);choose({site:i,sensor:4});}} onFocus={()=>{pin();expand(true);choose({site:i,sensor:4});}} onClick={()=>{pin();expand(true);choose({site:i,sensor:4});}} aria-label={'Explore '+s.name+' sensors'}><i/>{s.id}<span>{s.name}</span></button>)}
   {ready&&jointDefinitions.map((d,i)=><button hidden={mode!=='mocap'} key={d.id} ref={el=>{jointPins.current[i]=el;}} className={'joint-pin '+(joint===d.id?'is-active':'')} onClick={()=>setJoint(d.id)} aria-pressed={joint===d.id}>{d.name}</button>)}
   {ready&&activeJoint.markers.split(' → ').map((name,i)=><span hidden={mode!=='mocap'} key={i} ref={el=>{pointLabels.current[i]=el;}} className="marker-label">{name}</span>)}
  </div>
  <Tabs className="scene-mode" value={mode} onValueChange={v=>onModeChange(v as SceneMode)}><TabsList aria-label="3D acquisition view"><TabsTrigger value="sensors">Muscle sensors</TabsTrigger><TabsTrigger value="mocap">Motion capture</TabsTrigger></TabsList></Tabs>
  <a className="mocap-scene-link" href="#motion-capture"><ScanLine size={15}/>{marker||'NOKOV Mars2H · 16 cameras · 90 Hz'}</a>
  <div className="scene-controls">
   <button disabled={!ready} aria-label={playing?'Pause walking animation':'Play walking animation'} aria-pressed={playing} title={playing?'Pause motion':'Play motion'} onClick={()=>{setPlaying(!playing);api.current?.play(!playing);}}>{playing?<Pause size={17}/>:<Play size={17}/>}</button>
   {mode==='sensors'&&<button disabled={!ready} aria-label={expanded?'Reassemble sensors':'Explode sensors'} aria-pressed={expanded} title={expanded?'Reassemble sensors':'Explode sensors'} onClick={()=>expand(!expanded)}>{expanded?<Minus size={17}/>:<Expand size={17}/>}</button>}
  </div>
  <div className="scene-instruction"><MousePointer2 size={15}/><span>{mode==='mocap'?'Select a knee or ankle to highlight its marker vectors.':pinned?'Selection held open. Close the card to resume.':expanded?'Explore a sensor. Move away to reassemble.':'Hover over the model to explore the sensors.'}</span></div>
  <p className="drag-hint">Drag horizontally to rotate · Arrow keys when focused</p>
  <p className="scene-disclaimer">{mode==='mocap'?'Schematic marker positions · θ is the angle between the two vectors':'Illustrative walking · Arms crossed over the chest'}<br/>{mode==='mocap'?'Joint definitions follow SI Table S6':'LE230 at physical scale · Custom AMG board size estimated from Fig. 1'}</p>
  {failed&&<div className="fallback-buttons">{sites.map((s,i)=><button key={s.id} onClick={()=>choose({site:i,sensor:4})}>{s.id} {s.name}</button>)}</div>}
  {mode==='mocap'&&<aside className="sensor-info mocap-info" aria-live="polite"><button className="info-close" aria-label="Return to muscle sensors" onClick={()=>onModeChange('sensors')}><X size={16}/></button><p className="eyebrow">OPTICAL MOTION CAPTURE</p><h3>NOKOV Mars2H</h3><p>16 infrared cameras track 15 markers at 90 Hz.</p><Tabs value={joint} onValueChange={v=>setJoint(v as JointId)}><TabsList className="scene-joint-tabs" aria-label="Joint marker geometry">{jointDefinitions.map(d=><TabsTrigger value={d.id} key={d.id}>{d.name}</TabsTrigger>)}</TabsList></Tabs><div className="mocap-joint-caption"><strong>{activeJoint.name}</strong><p>{activeJoint.markers}</p><span>{activeJoint.rule}</span></div><small>Blue lines and the arc show the selected joint’s marker geometry. XINGYING 3.4.0.3957.</small><a className="mocap-method-link" href="https://arxiv.org/pdf/2608.11958#page=19" target="_blank" rel="noreferrer">SI Table S6 <ArrowUpRight size={14}/></a></aside>}
  {mode==='sensors'&&site&&selected&&<aside className="sensor-info" onPointerDown={pin} onPointerEnter={()=>api.current?.expand(true)} aria-live="polite" style={{'--sensor-color':site.color} as React.CSSProperties}>
   <button className="info-close" aria-label="Close sensor information" onClick={()=>expand(false)}><X size={16}/></button>
   <p className="eyebrow">{site.id} / {isEmg?'SURFACE EMG':'AMG 0'+(selected.sensor+1)}</p><h3>{site.name}</h3><p className="sensor-en">{site.area}</p>
   <p>{site.detail}</p><div className="device-selector" aria-label="Choose a sensor">{[0,1,2,3,4].map(j=><button key={j} aria-pressed={selected.sensor===j} onClick={()=>choose({site:selected.site,sensor:j})}>{j===4?'EMG':'A'+(j+1)}</button>)}</div>
   <div className="hardware-reference"><img src={isEmg?assetUrl('/assets/hardware/le230-official.webp'):assetUrl('/assets/hardware/ais2ihtr-official.jpg')} alt={isEmg?'Official Biometrics LE230 product photo, showing the black enclosure and silver dry contacts':'Official ST AIS2IHTR chip package image; the custom carrier board is separate'}/><div><strong>{isEmg?'Biometrics LE230':'ST AIS2IHTR'}</strong><span>{isEmg?'42 × 24 × 14 mm enclosure':'2 × 2 × 0.93 mm IC'}</span><a href={isEmg?'https://www.biometricsltd.com/surface-emg-sensor.htm':'https://www.st.com/en/mems-and-sensors/ais2ih.html'} target="_blank" rel="noreferrer">Manufacturer <ArrowUpRight size={12}/></a></div></div>
   <dl><div><dt>{isEmg?'Native sampling':'Nominal AMG grid'}</dt><dd>{isEmg?'1,000 Hz':'1,600 Hz'}</dd></div><div><dt>Channel</dt><dd>{isEmg?site.id+'_sEMG':site.id+'_S'+(selected.sensor+1)+'_{X,Y,Z}'}</dd></div><div><dt>{isEmg?'Dry contacts':'Custom board'}</dt><dd>{isEmg?'Ø10 mm · 20 mm spacing':'≈ 6 × 5 mm (estimated)'}</dd></div><div><dt>Signal unit</dt><dd>{isEmg?'µV':'g/digit'}</dd></div></dl>
   <small>{isEmg?'Geometry follows the manufacturer dimensions and paper Fig. 1.':'IC dimensions are from ST. Carrier-board dimensions are a visual estimate from paper Fig. 1, not a published measurement.'} Acquisition: paper §II–III and channels.csv.</small>
  </aside>}
 </div>;
}

