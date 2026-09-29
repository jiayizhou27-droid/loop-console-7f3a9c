let sdkStageResults=[],sdkStageWaveforms=[];
const v32Pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(2)}%`:'—';
const v32Sec=v=>Number.isFinite(Number(v))?`${Math.round(Number(v))} s`:'—';
const v32Decision={inherited_baseline:'继承已验证基准',accepted:'本阶段采纳',hold_previous_pid:'保持上一阶段'};

function drawLine(ctx,values,color,x,y,w,h,min,max,width=2,dash=[],smooth=false){
  if(!Array.isArray(values)||values.length<2)return;
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();
  const points=values.map((v,i)=>({x:x+i/(values.length-1)*w,y:y+h-(Number(v)-min)/(max-min||1)*h}));ctx.moveTo(points[0].x,points[0].y);
  if(smooth){for(let i=1;i<points.length-1;i++){const midX=(points[i].x+points[i+1].x)/2,midY=(points[i].y+points[i+1].y)/2;ctx.quadraticCurveTo(points[i].x,points[i].y,midX,midY)}ctx.lineTo(points.at(-1).x,points.at(-1).y)}else{for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y)}
  ctx.stroke();ctx.setLineDash([]);
}
function drawV32Canvas(canvas,series){
  const box=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;
  canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=box.width,h=box.height,p={l:34,r:18,t:18,b:28};
  ctx.fillStyle='#091419';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#20343c';ctx.lineWidth=1;
  for(let i=0;i<=12;i++){const x=p.l+(w-p.l-p.r)*i/12;ctx.beginPath();ctx.moveTo(x,p.t);ctx.lineTo(x,h-p.b);ctx.stroke()}
  for(let i=0;i<=6;i++){const y=p.t+(h-p.t-p.b)*i/6;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke()}
  const all=series.flatMap(s=>s.values||[]).map(Number).filter(Number.isFinite);if(!all.length)return;
  let min=Math.min(...all),max=Math.max(...all),pad=(max-min||1)*.12;min-=pad;max+=pad;
  series.forEach(s=>drawLine(ctx,s.values,s.color,p.l,p.t,w-p.l-p.r,h-p.t-p.b,min,max,s.width||2,s.dash||[],!!s.smooth));
  ctx.fillStyle='#76909a';ctx.font='11px ui-monospace';ctx.fillText(max.toFixed(2),4,p.t+8);ctx.fillText(min.toFixed(2),4,h-p.b);
}
function clearV32Canvas(canvas,message='当前 Stage 没有对应波形'){
  const box=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.fillStyle='#091419';ctx.fillRect(0,0,box.width,box.height);ctx.fillStyle='#76909a';ctx.font='15px sans-serif';ctx.textAlign='center';ctx.fillText(message,box.width/2,box.height/2);
}
function replayMetricRow(label,cls,m){return `<span class="${cls}">${label}<b>同窗计算</b></span><span class="${cls}"><b>${v32Pct(m?.overshoot_pct)}</b></span><span class="${cls}"><b>${v32Sec(m?.rise_time_s)}</b></span><span class="${cls}"><b>${v32Sec(m?.dynamic_settling_time_s)}</b></span><span class="${cls}"><b>${v32Pct(m?.steady_error_pct)}</b></span>`}
function showSdkStage(stage){
  const s=sdkStageResults.find(x=>Number(x.stage)===Number(stage)),matches=sdkStageWaveforms.filter(x=>Number(x.stage)===Number(stage)),w=matches[0];
  if(!s||matches.length!==1||!w){document.querySelector('#stageScopePid').textContent=`Stage ${String(stage).padStart(2,'0')} 校验失败：当前运行没有唯一对应波形`;document.querySelector('#stageScopeMetrics').innerHTML='';clearV32Canvas(document.querySelector('#tunedPvScopeCanvas'));clearV32Canvas(document.querySelector('#tunedMvScopeCanvas'));return}
  document.querySelector('#stageScopePid').textContent=`Stage ${String(s.stage).padStart(2,'0')} · ${w.sample_count} 点 / ${w.sample_time_s} s · 执行器惯性 ${activeRun?.waveforms?.actuator_tau_s??'—'} s · V32 PI Kc ${Number(s.output_Kc).toFixed(6)} · tauI ${Number(s.output_tauI_s).toFixed(3)} s · tauD 0`;
  const state=document.querySelector('#stageScopeState');state.textContent=`● V32 主管验收修订版 · STAGE ${String(s.stage).padStart(2,'0')} / ${sdkStageResults.length}${s.convergence_warning?' · 重点观察':''}`;state.title=s.convergence_warning?`${s.convergence_warning}；这是回放观察提示，不等于现场实测。`:'本阶段无附加回放收敛警告';
  document.querySelector('#stageScopeMetrics').innerHTML=`<span class="head">本图回放指标<b>同一观察窗口</b></span><span class="head">超调<b>Overshoot</b></span><span class="head">上升时间<b>Rise time</b></span><span class="head">调节时间<b>Settling</b></span><span class="head">稳态误差<b>Steady error</b></span>${replayMetricRow('历史实测','manual',w.historical_metrics)}${replayMetricRow('V32 单 Stage 回放','auto',w.waveform_metrics)}`;
  document.querySelectorAll('#stageRows tr').forEach(tr=>tr.classList.toggle('scope-active',Number(tr.dataset.stageRow)===Number(stage)));
  drawV32Canvas(document.querySelector('#tunedPvScopeCanvas'),[{values:w.PV_historical,color:'#ff795b',width:2.5},{values:w.PV_predicted,color:'#9eea3d',width:3},{values:w.SP,color:'#ffd34e',width:4,dash:[10,6]}]);
  drawV32Canvas(document.querySelector('#tunedMvScopeCanvas'),[{values:w.MV_historical,color:'#55a6ff',width:2.5},{values:w.MV_predicted,color:'#a98bff',width:3}]);
}
function applySdkResult(sequence,waveformPayload){
  sdkStageResults=Array.isArray(sequence?.rows)?sequence.rows:[];sdkStageWaveforms=Array.isArray(waveformPayload?.waveforms)?waveformPayload.waveforms:[];
  const ready=sdkStageResults.length&&sdkStageWaveforms.length;document.querySelector('#sdkStageCard').hidden=!sdkStageResults.length;document.querySelector('#sdkScopeCard').hidden=!ready;
  const target=document.querySelector('#stageRows'),select=document.querySelector('#stageScopeSelect');
  target.innerHTML=sdkStageResults.map(s=>{const w=sdkStageWaveforms.find(x=>Number(x.stage)===Number(s.stage)),m=w?.waveform_metrics;return `<tr data-stage-row="${s.stage}"><td>Stage ${String(s.stage).padStart(2,'0')}</td><td>${Number(s.output_Kc).toFixed(6)}</td><td>${Number(s.output_tauI_s).toFixed(3)}</td><td>0.000</td><td>${v32Pct(m?.overshoot_pct)}</td><td>${v32Sec(m?.rise_time_s)}</td><td>${v32Sec(m?.dynamic_settling_time_s)}</td><td>${v32Pct(m?.steady_error_pct)}</td><td><span class="decision ${s.decision==='accepted'||s.decision==='inherited_baseline'?'accepted':'hold'}" title="${s.convergence_warning||'尾段收敛检查无附加警告'}">${v32Decision[s.decision]||s.decision}${s.convergence_warning?' · 观察':''}</span></td><td><button class="stage-use" data-stage="${s.stage}">查看并采用</button></td></tr>`}).join('');
  select.innerHTML=sdkStageResults.map(s=>`<option value="${s.stage}">Stage ${String(s.stage).padStart(2,'0')}</option>`).join('');select.onchange=()=>showSdkStage(select.value);
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const s=sdkStageResults.find(x=>Number(x.stage)===Number(b.dataset.stage));select.value=String(s.stage);showSdkStage(s.stage);document.querySelector('#kp').value=s.output_Kc;document.querySelector('#ti').value=s.output_tauI_s;document.querySelector('#td').value=0;toast(`已载入 V32 Stage ${s.stage} PI；仅用于开环验证准备`) });
  if(ready)showSdkStage(sdkStageResults[0].stage);
}
function clearSdkResults(reason='等待运行 V32 SDK'){sdkStageResults=[];sdkStageWaveforms=[];document.querySelector('#sdkScopeCard').hidden=true;document.querySelector('#sdkStageCard').hidden=true;document.querySelector('#stageRows').innerHTML='';document.querySelector('#stageScopeMetrics').innerHTML='';document.querySelector('#stageScopePid').textContent=reason;clearV32Canvas(document.querySelector('#tunedPvScopeCanvas'),reason);clearV32Canvas(document.querySelector('#tunedMvScopeCanvas'),reason)}
window.addEventListener('resize',()=>{const s=document.querySelector('#stageScopeSelect');if(s&&sdkStageResults.length)showSdkStage(s.value)});
