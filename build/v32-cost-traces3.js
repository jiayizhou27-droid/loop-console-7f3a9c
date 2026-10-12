let PID_API_BASE=localStorage.getItem('pidApiBaseV32')||'',activeRun=null;
const V32_SAMPLE_SHA='0d08f5033bb436709de43867f858e080b9b947dc2f157fba2b67b948dec7bbde';
const COST_LABELS={overshoot:'超调惩罚',steady:'稳态误差',mean_error:'平均误差',rise:'上升时间',settling:'调节时间',oscillation:'振荡抑制',mv:'阀门动作',parameter:'参数变化'};
const COST_PROFILES={
  generic:{label:'通用 Generic',weights:{overshoot:20,steady:22,mean_error:15,rise:8,settling:17,oscillation:10,mv:5,parameter:3},kc:'0.50–1.60 × 初值',tau:'中性',note:'未知对象采用均衡且保守的离线配置'},
  flow:{label:'流量 Flow',weights:{overshoot:12,steady:27,mean_error:18,rise:8,settling:12,oscillation:14,mv:6,parameter:3},kc:'0.50–1.20 × 初值',tau:'较短',note:'弱比例、较强积分；关注快速消差，同时限制阀门频繁动作'},
  pressure:{label:'压力 Pressure',weights:{overshoot:26,steady:20,mean_error:13,rise:16,settling:13,oscillation:7,mv:3,parameter:2},kc:'0.50–1.40 × 初值',tau:'中性',note:'优先限制压力超调并保持较快响应；高低限由硬安全门负责'},
  temperature:{label:'温度 Temperature',weights:{overshoot:24,steady:20,mean_error:12,rise:5,settling:21,oscillation:8,mv:7,parameter:3},kc:'0.50–1.25 × 初值',tau:'较长',note:'大惯性和纯滞后对象；不为追求短上升时间牺牲超调与稳定性'},
  level:{label:'液位 Level',weights:{overshoot:8,steady:10,mean_error:10,rise:2,settling:12,oscillation:27,mv:20,parameter:11},kc:'0.50–1.15 × 初值',tau:'较长（建议 ≥900 s）',note:'库存缓冲对象允许慢响应；重点抑制振荡和阀门动作'}
};
let costWeights={},costDirty=false;
const apiInput=document.querySelector('#apiBase');apiInput.value=PID_API_BASE;
const status=(message,ok=false)=>{const el=document.querySelector('#v30Connection');el.textContent=message;el.classList.toggle('good',ok)};
async function apiJson(path,options){if(!PID_API_BASE)throw Error('尚未连接 V32 算法服务');const r=await fetch(PID_API_BASE+path,options),body=await r.json().catch(()=>null);if(!r.ok)throw Error(body?.detail||`HTTP ${r.status}`);return body}
async function sha256Text(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const close=(a,b)=>Math.abs(Number(a)-Number(b))<=1e-9;
function setFinalPid(pid){if(!pid)return;document.querySelector('#kp').value=pid.Kc;document.querySelector('#ti').value=pid.tauI;document.querySelector('#td').value=pid.tauD||0;document.querySelector('#confidence').textContent='V32 supervisor review · 2026-09-28'}
function weightTotal(){return Object.values(costWeights).reduce((a,b)=>a+Number(b||0),0)}
function normalizedCostWeights(){if(Math.abs(weightTotal()-100)>.001)throw Error('Cost Function 权重合计必须为 100%');return Object.fromEntries(Object.entries(costWeights).map(([k,v])=>[k,Number(v)/100]))}
function updateWeightSummary(){const total=weightTotal(),valid=Math.abs(total-100)<.001,totalEl=document.querySelector('#weightTotal');totalEl.textContent=`${total.toFixed(0)}%`;totalEl.classList.toggle('invalid',!valid);document.querySelector('#recalcBtn').disabled=!valid;document.querySelectorAll('.weight-bar').forEach(row=>{const key=row.dataset.weight;row.querySelector('u').style.width=`${Math.min(100,Math.max(0,costWeights[key]))}%`;row.querySelector('b').textContent=`${costWeights[key]}%`})}
function renderWeightPanel(){const keys=Object.keys(COST_LABELS),plot=document.querySelector('#weightPlot'),controls=document.querySelector('#weightControls');plot.innerHTML=keys.map(k=>`<div class="weight-bar" data-weight="${k}"><span>${COST_LABELS[k]}</span><i><u></u></i><b></b></div>`).join('');controls.innerHTML=keys.map(k=>`<label class="weight-control"><span>${COST_LABELS[k]}</span><input type="range" min="0" max="50" step="1" value="${costWeights[k]}" data-cost-range="${k}" aria-label="${COST_LABELS[k]}权重"><span class="weight-number"><input type="number" min="0" max="50" step="1" value="${costWeights[k]}" data-cost-number="${k}" aria-label="${COST_LABELS[k]}百分比"><em>%</em></span></label>`).join('');controls.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{const key=input.dataset.costRange||input.dataset.costNumber,value=Math.min(50,Math.max(0,Number(input.value)||0));costWeights[key]=value;costDirty=true;controls.querySelector(`[data-cost-range="${key}"]`).value=value;controls.querySelector(`[data-cost-number="${key}"]`).value=value;updateWeightSummary()}));updateWeightSummary()}
function applyCostProfile(name,announce=true){const p=COST_PROFILES[name]||COST_PROFILES.generic;costWeights={...p.weights};costDirty=false;document.querySelector('#profileNote').textContent=`${p.label}：${p.note}。当前公开核验结果仅适用于 Flow 与初始 PI 0.25 / 48 s；其他回路须连接私有 V32 服务重新计算。`;document.querySelector('#kcRange').textContent=p.kc;document.querySelector('#tauPreference').textContent=p.tau;renderWeightPanel();if(announce)toast(`已载入${p.label}默认 Cost Function 权重`);if(name!=='flow'&&sourceCsvFile){activeRun=null;clearSdkResults(`已选择${p.label}，等待私有 V32 服务按当前权重计算`);status(`${p.label}不能复用 Flow 固定结果；请连接私有 V32 服务运行分析。`)}}
function validateV32Payload(sequence,waveforms,{runId=null,csvSha='',sequenceSha=''}){
  const rows=sequence?.rows,waves=waveforms?.waveforms;if(!Array.isArray(rows)||rows.length!==16)throw Error('V32 结果必须恰好包含 16 个 Stage');if(!Array.isArray(waves)||waves.length!==16)throw Error('当前运行波形必须恰好包含 16 个 Stage');
  if(runId&&waveforms.run_id!==runId)throw Error('波形 run_id 与本次 V32 运行不一致');
  if(!csvSha||waveforms.input_csv_sha256!==csvSha)throw Error('波形与原始 CSV SHA256 不一致');
  if(sequenceSha&&waveforms.stage_sequence_sha256!==sequenceSha)throw Error('波形与 V32 Stage 结果 SHA256 不一致');
  if(Number(waveforms.actuator_tau_s)!==0)throw Error('波形不是当前 SDK 的 0 s 执行器惯性配置');
  const seen=new Set();
  rows.forEach((row,i)=>{const stage=i+1;if(Number(row.stage)!==stage)throw Error(`V32 Stage ${stage} 编号错误`);const matches=waves.filter(w=>Number(w.stage)===stage);if(matches.length!==1)throw Error(`Stage ${stage} 没有唯一对应波形`);const w=matches[0];if(seen.has(stage))throw Error(`Stage ${stage} 重复`);seen.add(stage);
    if(!close(w.pid?.Kc,row.output_Kc)||!close(w.pid?.tauI,row.output_tauI_s)||!close(w.pid?.tauD,0))throw Error(`Stage ${stage} 波形 PI 与正式输出 PI 不一致`);
    if(!Number.isFinite(Number(w.sample_time_s))||Number(w.sample_time_s)<=0)throw Error(`Stage ${stage} 采样周期无效`);
    const arrays=['time','SP','PV_historical','MV_historical','PV_predicted','MV_predicted'].map(k=>w[k]);if(arrays.some(a=>!Array.isArray(a)))throw Error(`Stage ${stage} 波形数组缺失`);const n=arrays[0].length;if(n<2||arrays.some(a=>a.length!==n)||Number(w.sample_count)!==n)throw Error(`Stage ${stage} 波形数组长度不一致`);
    for(const group of ['historical_metrics','waveform_metrics'])for(const key of ['overshoot_pct','rise_time_s','dynamic_settling_time_s','steady_error_pct'])if(!Number.isFinite(Number(w[group]?.[key])))throw Error(`Stage ${stage} ${group} 缺少 ${key}`);
  });return true;
}
async function loadBundledV32Results(){
  try{
    if(document.querySelector('#loopType').value!=='flow'||costDirty||!close(document.querySelector('#kp').value,.25)||!close(document.querySelector('#ti').value,48)||!close(document.querySelector('#td').value,0))throw Error('当前回路、权重或初始 PI 不是公开 Flow 核验配置，请连接私有 V32 服务');
    if(sourceCsvSha256!==V32_SAMPLE_SHA)throw Error('请先载入与 V32 核验包一致的原始 CSV');
    const [sr,wr]=await Promise.all([fetch('v32_stage_pid_sequence.json',{cache:'no-store'}),fetch('v32_stage_waveforms.json',{cache:'no-store'})]);if(!sr.ok||!wr.ok)throw Error('V32 静态核验文件读取失败');const sequenceText=await sr.text(),waveformText=await wr.text(),sequence=JSON.parse(sequenceText),waveforms=JSON.parse(waveformText),sequenceSha=await sha256Text(sequenceText.replace(/\r\n/g,'\n'));
    validateV32Payload(sequence,waveforms,{csvSha:sourceCsvSha256,sequenceSha});activeRun={sequence,waveforms,bundled:true,csvSha:sourceCsvSha256,loop_type:'flow',cost_weights:normalizedCostWeights()};applySdkResult(sequence,waveforms);status(`V32 同源核验结果已载入 · Flow 默认权重 · 16 Stage · 执行器惯性 0 s`,true);
  }catch(e){activeRun=null;clearSdkResults('V32 波形校验失败');status('V32 波形拒绝显示：'+e.message);throw e}
}
document.querySelector('#connectApi').onclick=async()=>{PID_API_BASE=apiInput.value.trim().replace(/\/$/,'');if(!PID_API_BASE){status('请输入 V32 算法服务地址');return}try{const h=await apiJson('/health');localStorage.setItem('pidApiBaseV32',PID_API_BASE);status(`V32 算法服务已连接：${h.version}`,true);toast('V32 算法服务连接成功')}catch(e){status('连接失败：'+e.message);toast('V32 算法服务连接失败')}};
document.querySelector('#recalcBtn').onclick=async()=>{
  if(!PID_API_BASE){const loop=document.querySelector('#loopType').value,baseline=!costDirty&&loop==='flow'&&close(document.querySelector('#kp').value,.25)&&close(document.querySelector('#ti').value,48)&&close(document.querySelector('#td').value,0);if(!baseline){activeRun=null;clearSdkResults('当前选择需要私有 V32 服务重新计算');status('非 Flow、人工权重或非基准初始 PI 不能复用固定结果；请连接私有 V32 服务。');toast('当前配置需要连接私有 V32 服务');return}try{await loadBundledV32Results();toast('已载入同源 V32 Stage PI、波形与指标')}catch(e){toast('未显示波形：'+e.message)}return}
  if(!sourceCsvFile){toast('请先输入 SP/PV/MV 历史 CSV');return}
  const button=document.querySelector('#recalcBtn'),initial={Kc:+document.querySelector('#kp').value,tauI:+document.querySelector('#ti').value,tauD:+document.querySelector('#td').value},loop_type=document.querySelector('#loopType').value;let cost_weights;try{cost_weights=normalizedCostWeights()}catch(e){status(e.message);toast(e.message);return}button.disabled=true;button.textContent='正在运行 V32…';activeRun=null;clearSdkResults('V32 正在计算');
  try{const form=new FormData();form.append('file',sourceCsvFile,sourceCsvFile.name||'input.csv');const analysis=await apiJson('/runs/analyze',{method:'POST',body:form});const result=await apiJson(`/runs/${analysis.run_id}/tune-v32`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...initial,loop_type,cost_weights})});if(!result.stage_sequence_available)throw Error('当前数据、回路或初始 PI 未匹配已核验的 V32 Stage 结果');const sequence={stage_count:result.stage_pid_sequence.length,rows:result.stage_pid_sequence,field_trial_eligible:result.field_trial_eligible};const waveforms=await apiJson(`/runs/${analysis.run_id}/v32-stage-waveforms`);validateV32Payload(sequence,waveforms,{runId:analysis.run_id,csvSha:sourceCsvSha256});setFinalPid(result.recommended_pid);activeRun={result,sequence,waveforms,run_id:analysis.run_id,csvSha:sourceCsvSha256,loop_type,cost_weights};applySdkResult(sequence,waveforms);status(`V32 完成 · ${COST_PROFILES[loop_type]?.label||loop_type} · 自定义权重已提交 · run_id ${analysis.run_id}`,true);toast('已显示本次运行的 V32 逐 Stage 波形')}catch(e){activeRun=null;clearSdkResults('当前运行没有可验证的对应波形');status('V32 波形拒绝显示：'+e.message);toast('V32 波形拒绝显示：'+e.message)}finally{button.disabled=Math.abs(weightTotal()-100)>.001;button.textContent='运行 V32 分析'}
};
document.querySelector('#applyBtn').onclick=()=>{if(!activeRun){toast('没有 V32 有效结果');return}const s=activeRun.sequence.rows.at(-1);versions.unshift({time:'V32 开环验证准备 · '+new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V32',params:`Stage 16 · Kc ${s.output_Kc} · tauI ${s.output_tauI_s}s · tauD 0`,state:'禁止直接投用'});renderHistory();toast('V32 建议已保存；不可直接写入 DCS')};
document.querySelector('#saveBtn').onclick=()=>activeRun?toast('V32 建议版本已保存'):toast('无可保存的 V32 结果');
document.querySelector('#loopType').addEventListener('change',e=>applyCostProfile(e.target.value));
document.querySelector('#resetWeights').onclick=()=>applyCostProfile(document.querySelector('#loopType').value);
applyCostProfile(document.querySelector('#loopType').value,false);
status('请载入历史 CSV；参数、波形与指标将按同一运行严格校验');
