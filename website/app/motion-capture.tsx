'use client';
import {ScanLine,ArrowUpRight} from 'lucide-react';
export default function MotionCapture({onExplore}:{onExplore:()=>void}){
 return <article className="modality-card mocap-card" id="motion-capture"><div className="card-top"><ScanLine size={26}/><span>03 / KINEMATICS</span></div><h3>Optical motion capture<br/><span>NOKOV Mars2H</span></h3><p>16 infrared cameras track 15 markers to provide reference angles for both knees and ankles.</p><footer><strong>90 <small>Hz</small></strong><a href="#explore" onClick={onExplore}>Explore marker geometry <ArrowUpRight size={15}/></a></footer></article>;
}
