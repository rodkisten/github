import type { ReportSection } from './render.js';
export interface TimedJob {
  name: string; started_at?: string | null; completed_at?: string | null;
  conclusion?: string | null;
  steps?: { name: string; started_at?: string | null; completed_at?: string | null; conclusion?: string | null }[];
}
function seconds(start?: string|null,end?: string|null): number | undefined {
  if (!start || !end) return;
  const n=(Date.parse(end)-Date.parse(start))/1000;
  return Number.isFinite(n)&&n>=0?n:undefined;
}
export function workflowSections(jobs: TimedJob[], artifacts: {name:string;size_in_bytes:number;expired:boolean;id?:number}[], repository?:string, runId?:number): ReportSection[] {
  const completed=jobs.flatMap(j=>{const duration=seconds(j.started_at,j.completed_at);return duration===undefined?[]:[{name:j.name,duration}];});
  const steps=jobs.flatMap(j=>(j.steps??[]).flatMap(s=>{const duration=seconds(s.started_at,s.completed_at);return duration===undefined?[]:[{name:j.name+' / '+s.name,duration}];})).sort((a,b)=>b.duration-a.duration);
  const sum=completed.reduce((a,b)=>a+b.duration,0);
  const slow=steps[0];
  const live=artifacts.filter(a=>!a.expired);
  return [
    {title:'Workflow intelligence (snapshot)',rows:[
      {label:'Completed jobs',value:completed.length+' / '+jobs.length},
      {label:'Total completed job time',value:sum.toFixed(1)+' s'},
      {label:'Slowest completed step',value:slow?slow.name.slice(0,300)+' · '+slow.duration.toFixed(1)+' s':'Not available'},
      {label:'Failed jobs',value:String(jobs.filter(j=>j.conclusion==='failure').length)},
      {label:'Available artifacts',value:String(live.length)},
    ]},
    {title:'Slowest steps',collapsed:true,rows:steps.slice(0,10).map(s=>({label:s.name.slice(0,300),value:s.duration.toFixed(1)+' s'}))},
    {title:'Artifacts',collapsed:true,rows:live.slice(0,20).map(a=>({label:a.name,...(repository && runId && a.id ? {url:'https://github.com/'+repository+'/actions/runs/'+runId+'/artifacts/'+a.id}:{}),value:(a.size_in_bytes/1024).toFixed(2)+' KiB'}))},
  ];
}
