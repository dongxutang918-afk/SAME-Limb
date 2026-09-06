/* oxlint-disable next/no-img-element -- Original SI image is served directly by the static export. */
'use client';
import {assetUrl} from './asset-path';
import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import data from './research-data.json';
import {protocols} from './task-protocol';
import {protocolBriefs} from './protocol-briefs';

export default function ProtocolExplorer(){
 const [condition,setCondition]=useState('Deep Squat');
 const active=protocols[condition];
 return <section className="protocol-section" id="protocol"><div className="section">
  <div className="section-heading"><div><p className="eyebrow">ACQUISITION PROTOCOL</p><h2>Standardized lower-limb activities</h2></div><p className="section-lead">Eleven functional actions and five walking speeds. Select an activity for its essential instructions.</p></div>
  <figure className="protocol-overview"><a href={assetUrl('/assets/paper-task-protocol.jpg')} target="_blank" rel="noreferrer"><img src={assetUrl('/assets/paper-task-protocol.jpg')} alt="Supplementary Figure S1: all 11 functional lower-limb actions and treadmill walking, shown together in the original study photographs" loading="lazy"/></a><figcaption>Supplementary Fig. S1 · All recorded activities <a href={assetUrl('/assets/paper-task-protocol.jpg')} target="_blank" rel="noreferrer">Open full figure <ArrowUpRight size={15}/></a></figcaption></figure>
  <Tabs value={condition} onValueChange={v=>setCondition(String(v))}><TabsList className="protocol-tabs" aria-label="Task condition">{data.conditions.map(c=><TabsTrigger value={c.condition_name} key={c.condition_id}>{protocols[c.condition_name].name}</TabsTrigger>)}</TabsList></Tabs>
  <div className="protocol-brief" aria-live="polite"><h3>{active.name}</h3><div><p>{protocolBriefs[condition]}</p><span>{active.timing==='cued'?'Auditory cues at approximately 2, 6, and 10 s.':active.timing==='walking'?'Four planned trials at each speed.':'Sustained posture; no repeated movement cues.'}</span></div></div>
  <div className="protocol-brief-footer"><span>Arms crossed during functional actions, unless hand contact is required.</span><a href="https://arxiv.org/pdf/2608.11958#page=14" target="_blank" rel="noreferrer">Full protocol · SI Table S2 ↗</a></div>
 </div></section>;
}
