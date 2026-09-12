// V30 SDK run 7475c85ea884: stage_results / pid_by_stage.csv.
// Each row is the PID state returned for that stage; it is not expanded from recommended_pid.
const v30StageResults = [
  {stage:1,Kc:.25,tauI:48,tauD:0,overshoot:.0344938194,rise_time:300,settling_time:1200,settled:false,steady_state_error:.0026517236,decision:'hold'},
  {stage:2,Kc:.25,tauI:48,tauD:0,overshoot:.0241493630,rise_time:60,settling_time:780,settled:true,steady_state_error:.0011164578,decision:'hold'},
  {stage:3,Kc:.25,tauI:48,tauD:0,overshoot:.0660428546,rise_time:60,settling_time:1200,settled:false,steady_state_error:.0229354548,decision:'hold'},
  {stage:4,Kc:.25,tauI:48,tauD:0,overshoot:.0279961743,rise_time:600,settling_time:1200,settled:false,steady_state_error:.0099933391,decision:'hold'},
  {stage:5,Kc:.25,tauI:48,tauD:0,overshoot:.0145487930,rise_time:420,settling_time:1200,settled:false,steady_state_error:.0021826763,decision:'hold'},
  {stage:6,Kc:.25,tauI:50.4,tauD:0,overshoot:.0400012014,rise_time:720,settling_time:1200,settled:false,steady_state_error:.0118848875,decision:'accepted'},
  {stage:7,Kc:.25,tauI:50.4,tauD:0,overshoot:.1622123548,rise_time:60,settling_time:1200,settled:false,steady_state_error:.0037875687,decision:'hold'},
  {stage:8,Kc:.2,tauI:60.48,tauD:0,overshoot:.4314965385,rise_time:60,settling_time:1200,settled:false,steady_state_error:.0170306365,decision:'accepted'},
  {stage:9,Kc:.2,tauI:60.48,tauD:0,overshoot:.0880341786,rise_time:360,settling_time:1200,settled:false,steady_state_error:.0074870853,decision:'hold'},
  {stage:10,Kc:.2,tauI:54.432,tauD:0,overshoot:0,rise_time:1020,settling_time:1200,settled:false,steady_state_error:.0783891569,decision:'accepted'},
  {stage:11,Kc:.2,tauI:54.432,tauD:0,overshoot:.2652857056,rise_time:120,settling_time:1200,settled:false,steady_state_error:.0126030424,decision:'hold'},
  {stage:12,Kc:.2,tauI:54.432,tauD:0,overshoot:.0744136421,rise_time:240,settling_time:1200,settled:false,steady_state_error:.0050491630,decision:'hold'},
  {stage:13,Kc:.2,tauI:54.432,tauD:0,overshoot:.0129425239,rise_time:240,settling_time:1200,settled:false,steady_state_error:.0049418150,decision:'hold'},
  {stage:14,Kc:.2,tauI:62.5968,tauD:0,overshoot:.1076647775,rise_time:60,settling_time:1200,settled:false,steady_state_error:.0039685878,decision:'accepted'},
  {stage:15,Kc:.2,tauI:62.5968,tauD:0,overshoot:.0302916696,rise_time:720,settling_time:1200,settled:false,steady_state_error:.0009785182,decision:'hold'},
  {stage:16,Kc:.2,tauI:62.5968,tauD:0,overshoot:.0687394733,rise_time:60,settling_time:1200,settled:false,steady_state_error:.0185084189,decision:'hold'}
];

let displayedStageResults = v30StageResults;
let stageWaveforms = [];

function drawStageScope(stageNumber) {
  const waveform = stageWaveforms.find(item => item.stage === Number(stageNumber));
  const result = displayedStageResults.find(item => item.stage === Number(stageNumber));
  const canvas = document.querySelector('#tunedScopeCanvas');
  const metrics = document.querySelector('#stageScopeMetrics');
  const pidLabel = document.querySelector('#stageScopePid');
  if (!canvas || !result) return;
  document.querySelectorAll('#stageRows tr').forEach((row, index) => row.classList.toggle('scope-active', index === Number(stageNumber) - 1));
  pidLabel.textContent = `Stage ${String(stageNumber).padStart(2,'0')} · Kc ${result.Kc} · tauI ${result.tauI} s · tauD ${result.tauD} s`;
  metrics.innerHTML = `<span class="${result.overshoot > .1 ? 'warn' : ''}">超调<b>${(result.overshoot*100).toFixed(2)}%</b></span><span>上升时间<b>${result.rise_time.toFixed(0)} s</b></span><span class="${result.settled ? '' : 'warn'}">调节时间<b>${result.settled ? result.settling_time.toFixed(0)+' s' : '未稳定'}</b></span><span>稳态误差<b>${(result.steady_state_error*100).toFixed(2)}%</b></span>`;
  const ctx = canvas.getContext('2d'), dpr = devicePixelRatio || 1, width = canvas.clientWidth, height = canvas.clientHeight;
  canvas.width = width*dpr; canvas.height = height*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height);
  if (!waveform) { ctx.fillStyle='#708891';ctx.font='13px Inter';ctx.fillText('该 Stage 尚无 V30 预测波形',20,height/2);return; }
  const sp=waveform.SP, pv=waveform.PV_predicted, mv=waveform.MV_predicted;
  const values=[...sp,...pv,...mv].filter(Number.isFinite), min=Math.min(...values), max=Math.max(...values), pad=(max-min)*.12||1;
  const x=i=>i/Math.max(sp.length-1,1)*width, y=v=>height-(v-min+pad)/(max-min+2*pad)*height;
  ctx.strokeStyle='rgba(63,91,102,.28)';ctx.lineWidth=1;
  for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(0,height*i/5);ctx.lineTo(width,height*i/5);ctx.stroke()}
  const target=sp.slice(-Math.max(3,Math.floor(sp.length/4))).sort((a,b)=>a-b)[Math.floor(Math.max(3,Math.floor(sp.length/4))/2)];
  const amplitude=Math.abs(target-pv[0]); const band=Math.max(.02*amplitude,.005*Math.max(Math.abs(target),1));
  ctx.fillStyle='rgba(185,239,91,.08)';ctx.fillRect(0,y(target+band),width,y(target-band)-y(target+band));
  const plot=(series,color,lineWidth=2,dash=[])=>{ctx.beginPath();ctx.setLineDash(dash);series.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();ctx.setLineDash([])};
  plot(sp,'#ffb84a',1.5,[6,4]);plot(pv,'#b9ef5b',2.2);plot(mv,'#a98bff',1.4);
  const dt=waveform.time.length>1?Math.max(1,(new Date(waveform.time[1].replace(' ','T'))-new Date(waveform.time[0].replace(' ','T')))/1000):1;
  const marker=(seconds,label,color)=>{if(!Number.isFinite(seconds)||seconds<0)return;const px=Math.min(width-1,seconds/Math.max(dt*(sp.length-1),1)*width);ctx.setLineDash([4,4]);ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,height);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='11px ui-monospace';ctx.fillText(label,Math.min(px+5,width-88),height-10)};
  marker(result.rise_time,'Tr '+result.rise_time.toFixed(0)+'s','#55a6ff');
  if(result.settled) marker(result.settling_time,'Ts '+result.settling_time.toFixed(0)+'s','#b9ef5b');
  const upward=target>=pv[0], peakValue=upward?Math.max(...pv):Math.min(...pv), peakIndex=pv.indexOf(peakValue);
  ctx.fillStyle='#ffb84a';ctx.beginPath();ctx.arc(x(peakIndex),y(peakValue),4,0,Math.PI*2);ctx.fill();ctx.font='11px ui-monospace';ctx.fillText(`Mp ${(result.overshoot*100).toFixed(2)}%`,Math.min(x(peakIndex)+7,width-92),Math.max(18,y(peakValue)-7));
}

function selectStageScope(stageNumber) {
  const select=document.querySelector('#stageScopeSelect');
  if(select) select.value=String(stageNumber);
  drawStageScope(Number(stageNumber));
}

async function loadStageWaveforms() {
  const select=document.querySelector('#stageScopeSelect');
  try {
    const response=await fetch('stage_waveforms.json'); if(!response.ok) throw Error('waveform file');
    const payload=await response.json(); stageWaveforms=payload.waveforms||[];
    select.innerHTML=stageWaveforms.map(item=>`<option value="${item.stage}">Stage ${String(item.stage).padStart(2,'0')}</option>`).join('');
    select.onchange=()=>drawStageScope(Number(select.value));
    if(stageWaveforms.length)drawStageScope(stageWaveforms[0].stage);
  } catch (_) {
    document.querySelector('#stageScopeState').textContent='预测波形未载入';
    select.innerHTML='<option>无可用 Stage</option>';
  }
}

function renderStages(results = displayedStageResults) {
  const target = document.querySelector('#stageRows');
  if (!target) return;
  const summary = document.querySelector('.stage-summary');
  if (summary) summary.innerHTML = `<span><b>${results.length || '—'}</b> 个阶段</span><span><b class="good">${results.length}</b> 组逐阶段参数</span><span><b>0</b> 组人工参数</span>`;
  const pct = value => Number.isFinite(value) ? (value * 100).toFixed(2) + '%' : '—';
  const sec = value => Number.isFinite(value) ? value.toFixed(0) : '—';
  if (!Array.isArray(results) || !results.length) {
    target.innerHTML = '<tr><td colspan="10" class="stage-empty">当前 CSV 尚未返回逐阶段整定结果。请连接 V30 服务并读取 stage_results。</td></tr>';
    return;
  }
  target.innerHTML = results.map(s => `<tr>
    <td>Stage ${String(s.stage).padStart(2, '0')}</td>
    <td>${Number.isFinite(s.Kc) ? s.Kc.toFixed(4) : '—'}</td>
    <td>${Number.isFinite(s.tauI) ? s.tauI.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '—'}</td>
    <td>${Number.isFinite(s.tauD) ? s.tauD.toFixed(1) : '—'}</td>
    <td>${pct(s.overshoot)}</td><td>${sec(s.rise_time)}</td>
    <td>${s.settled ? sec(s.settling_time) : `${sec(s.settling_time)} · 未稳定`}</td>
    <td>${pct(s.steady_state_error)}</td>
    <td><span class="decision ${s.decision === 'accepted' ? 'accepted' : 'hold'}">${s.decision === 'accepted' ? '已接受' : '保持'}</span></td>
    <td><button class="stage-use" data-stage="${s.stage}">采用该阶段</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-stage]').forEach(button => button.onclick = () => {
    const s = results.find(row => row.stage === Number(button.dataset.stage));
    if (!s) return;
    document.querySelector('#kp').value = s.Kc;
    document.querySelector('#ti').value = s.tauI;
    document.querySelector('#td').value = s.tauD;
    selectStageScope(s.stage);
    versions.unshift({time:`Stage ${s.stage} 建议 · ` + new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V30 自整定',params:`Kc ${s.Kc} · tauI ${s.tauI} s · tauD ${s.tauD} s`,state:'待人工确认'});
    renderHistory();
    toast(`Stage ${s.stage} 参数已暂存，未写入 DCS`);
  });
}

function clearStageResultsForNewData() {
  displayedStageResults = [];
  renderStages(displayedStageResults);
  document.querySelector('#kp').value = '';
  document.querySelector('#ti').value = '';
  document.querySelector('#td').value = '';
  stageWaveforms = [];
  const select=document.querySelector('#stageScopeSelect'); if(select) select.innerHTML='<option>等待 V30 结果</option>';
  const metrics=document.querySelector('#stageScopeMetrics'); if(metrics) metrics.innerHTML='';
  const canvas=document.querySelector('#tunedScopeCanvas'); if(canvas) canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
}

renderStages();
loadStageWaveforms();
window.addEventListener('resize',()=>{const select=document.querySelector('#stageScopeSelect');if(select&&stageWaveforms.length)drawStageScope(Number(select.value||1))});
