/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The overflowing plot region is keyboard-scrollable. */
'use client';
import {BarChart,Bar,CartesianGrid,XAxis,YAxis,Tooltip,ErrorBar,LabelList} from 'recharts';
import {ChartContainer} from '@/components/ui/chart';

export type ColumnDatum={label:string;value:number;fill:string;low?:number;high?:number;count?:number};
type Props={rows:ColumnDatum[];kind?:string;metricLabel:string;correlation?:boolean;domainMax?:number};
const siteColors=['#a7c8df','#75afd3','#3e90c2','#0071e3'];
const wrapped:Record<string,string[]>={
 'Random Forest':['Random','Forest'],'InceptionTimePlus':['InceptionTime','Plus'],
 'Full-band':['Full band'],'20 Hz low-pass':['≤20 Hz','Low-pass'],
 '5–100 Hz band-pass':['5–100 Hz','Band-pass'],'100–760 Hz band-pass':['100–760 Hz','Band-pass'],
};
function CategoryTick({x=0,y=0,payload}:{x?:number;y?:number;payload?:{value?:string}}){
 const value=payload?.value??'',lines=wrapped[value]??[value];
 return <g transform={`translate(${x},${y})`}><text textAnchor="middle" fill="#61778b">{lines.map((line,i)=><tspan key={i} x="0" dy={i===0?19:18}>{line}</tspan>)}</text></g>;
}
function ColumnTooltip({active,payload,metricLabel}:{active?:boolean;payload?:readonly{payload?:ColumnDatum}[];metricLabel:string}){
 const row=payload?.[0]?.payload;if(!active||!row)return null;
 return <div className="column-tooltip"><span>{row.label}</span><strong>{row.value.toFixed(3)} <small>{metricLabel}</small></strong>{row.low!==undefined&&row.high!==undefined&&<p>95% interval: {row.low.toFixed(3)} – {row.high.toFixed(3)}°</p>}</div>;
}
export default function ExperimentColumns({rows,kind='',metricLabel,correlation=false,domainMax}:Props){
 const coverage=kind==='coverage',intervals=rows.some(r=>r.low!==undefined);
 const plotRows=rows.map(r=>({...r,error:r.low===undefined?undefined:[r.value-r.low,r.high!-r.value]}));
 const upper=domainMax??(correlation?1:Math.ceil(Math.max(...rows.map(r=>r.high??r.value))*1.15));
 return <>
  <section className="column-scroll" aria-label={`${metricLabel} column chart${coverage?' and muscle-site matrix':''}`} tabIndex={0}><div className={'column-surface '+(coverage?'column-coverage':'column-standard')}>
   <ChartContainer config={{value:{label:metricLabel,color:'#0071e3'}}} className="research-chart column-chart">
    <BarChart data={plotRows} margin={{top:25,right:20,bottom:10,left:12}} barCategoryGap={coverage?'28%':'36%'} accessibilityLayer>
     <CartesianGrid vertical={false} strokeDasharray="3 5"/>
     <XAxis type="category" dataKey="label" interval={0} height={coverage?30:58} axisLine={false} tickLine={false} tick={coverage?undefined:<CategoryTick/>} tickFormatter={coverage?label=>String(rows.findIndex(r=>r.label===label)+1):undefined}/>
     <YAxis type="number" width={48} domain={[0,upper]} axisLine={false} tickLine={false}/>
     <Tooltip cursor={{fill:'#dceaf544'}} content={<ColumnTooltip metricLabel={metricLabel}/>}/>
     <Bar dataKey="value" radius={[5,5,0,0]} maxBarSize={coverage?44:92}>
      {intervals?<ErrorBar dataKey="error" direction="y" width={5} stroke="#304960" strokeWidth={1.5}/>:<LabelList dataKey="value" position="top" offset={10} formatter={v=>typeof v==='number'?v.toFixed(3):''} fill="#304960"/>}
     </Bar>
    </BarChart>
   </ChartContainer>
   {coverage&&<div className="coverage-dot-matrix" aria-label="Muscles included in each numbered configuration">{['RF','VM','TA','GA'].map(site=><div className="coverage-matrix-row" key={site} style={{gridTemplateColumns:`60px repeat(${rows.length},minmax(0,1fr)) 20px`}}><strong>{site}</strong>{rows.map((r,i)=><span key={r.label} title={`${i+1}: ${r.label}`} aria-label={`Configuration ${i+1}, ${site} ${r.label.includes(site)?'included':'not included'}`}><i className={r.label.includes(site)?'included':''}/></span>)}<span/></div>)}</div>}
  </div></section>
  {coverage&&<div className="coverage-chart-key"><span>Filled dots indicate included muscle sites.</span><div>{siteColors.map((color,i)=><span key={color}><i style={{background:color}}/>{i+1} {i?'sites':'site'}</span>)}</div></div>}
 </>;
}
