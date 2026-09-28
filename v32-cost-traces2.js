let PID_API_BASE=localStorage.getItem('pidApiBaseV32')||'',activeRun=null;
const V32_SAMPLE_SHA='0d08f5033bb436709de43867f858e080b9b947dc2f157fba2b67b948dec7bbde';
const apiInput=document.querySelector('#apiBase');apiInput.value=PID_API_BASE;
const status=(message,ok=false)=>{const el=document.querySelector('#v30Connection');el.textContent=message;el.classList.toggle('good',ok)};
async function apiJson(path,options){if(!PID_API_BASE)throw Error('尚未连接 V32 算法服务');const r=await fetch(PID_API_BASE+path,options),body=await r.json().catch(()=>null);if(!r.ok)throw Error(body?.detail||`HTTP ${r.status}`);return body}
async function sha256Text(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const close=(a,b)=>Math.abs(Number(a)-Number(b))<=1e-9;
function setFinalPid(pid){if(!pid)return;document.querySelector('#kp').value=pid.Kc;document.querySelector('#ti').value=pid.tauI;document.querySelector('#td').value=pid.tauD||0;document.querySelector('#confidence').textContent='V32 supervisor review · 2026-09-28'}
function validateV32Payload(sequence,waveforms,{runId=null,csvSha='',sequenceSha=''}){
  const rows=sequence?.rows,waves=waveforms?.waveforms;if(!Array.isArray(rows)||rows.length!==16)throw Error('V32 参数链必须恰好包含 16 个 Stage');if(!Array.isArray(waves)||waves.length!==16)throw Error('当前运行波形必须恰好包含 16 个 Stage');
  if(runId&&waveforms.run_id!==runId)throw Error('波形 run_id 与本次 V32 运行不一致');
  if(!csvSha||waveforms.input_csv_sha256!==csvSha)throw Error('波形与原始 CSV SHA256 不一致');
  if(sequenceSha&&waveforms.stage_sequence_sha256!==sequenceSha)throw Error('波形与正式 PI 链 SHA256 不一致');
  if(Number(waveforms.actuator_tau_s)!==0)throw Error('波形不是当前 SDK 的 0 s 执行器惯性配置');
  const seen=new Set();
  rows.forEach((row,i)=>{const stage=i+1;if(Number(row.stage)!==stage)throw Error(`参数链 Stage ${stage} 顺序错误`);const matches=waves.filter(w=>Number(w.stage)===stage);if(matches.length!==1)throw Error(`Stage ${stage} 没有唯一对应波形`);const w=matches[0];if(seen.has(stage))throw Error(`Stage ${stage} 重复`);seen.add(stage);
    if(!close(w.pid?.Kc,row.output_Kc)||!close(w.pid?.tauI,row.output_tauI_s)||!close(w.pid?.tauD,0))throw Error(`Stage ${stage} 波形 PI 与正式输出 PI 不一致`);
    if(!Number.isFinite(Number(w.sample_time_s))||Number(w.sample_time_s)<=0)throw Error(`Stage ${stage} 采样周期无效`);
    const arrays=['time','SP','PV_historical','MV_historical','PV_predicted','MV_predicted'].map(k=>w[k]);if(arrays.some(a=>!Array.isArray(a)))throw Error(`Stage ${stage} 波形数组缺失`);const n=arrays[0].length;if(n<2||arrays.some(a=>a.length!==n)||Number(w.sample_count)!==n)throw Error(`Stage ${stage} 波形数组长度不一致`);
    for(const group of ['historical_metrics','waveform_metrics'])for(const key of ['overshoot_pct','rise_time_s','dynamic_settling_time_s','steady_error_pct'])if(!Number.isFinite(Number(w[group]?.[key])))throw Error(`Stage ${stage} ${group} 缺少 ${key}`);
  });return true;
}
async function loadBundledV32Results(){
  try{
    if(sourceCsvSha256!==V32_SAMPLE_SHA)throw Error('请先载入与 V32 核验包一致的原始 CSV');
    const [sr,wr]=await Promise.all([fetch('v32_stage_pid_sequence.json',{cache:'no-store'}),fetch('v32_stage_waveforms.json',{cache:'no-store'})]);if(!sr.ok||!wr.ok)throw Error('V32 静态核验文件读取失败');const sequenceText=await sr.text(),waveformText=await wr.text(),sequence=JSON.parse(sequenceText),waveforms=JSON.parse(waveformText),sequenceSha=await sha256Text(sequenceText);
    validateV32Payload(sequence,waveforms,{csvSha:sourceCsvSha256,sequenceSha});const final=sequence.rows.at(-1);activeRun={sequence,waveforms,bundled:true,csvSha:sourceCsvSha256};setFinalPid({Kc:final.output_Kc,tauI:final.output_tauI_s,tauD:0});applySdkResult(sequence,waveforms);status(`V32 同源核验结果已载入 · 16 Stage · 执行器惯性 0 s`,true);
  }catch(e){activeRun=null;clearSdkResults('V32 波形校验失败');status('V32 波形拒绝显示：'+e.message);throw e}
}
document.querySelector('#connectApi').onclick=async()=>{PID_API_BASE=apiInput.value.trim().replace(/\/$/,'');if(!PID_API_BASE){status('请输入 V32 算法服务地址');return}try{const h=await apiJson('/health');localStorage.setItem('pidApiBaseV32',PID_API_BASE);status(`V32 算法服务已连接：${h.version}`,true);toast('V32 算法服务连接成功')}catch(e){status('连接失败：'+e.message);toast('V32 算法服务连接失败')}};
document.querySelector('#recalcBtn').onclick=async()=>{
  if(!PID_API_BASE){try{await loadBundledV32Results();toast('已载入同源 V32 Stage PI、波形与指标')}catch(e){toast('未显示波形：'+e.message)}return}
  if(!sourceCsvFile){toast('请先输入 SP/PV/MV 历史 CSV');return}
  const button=document.querySelector('#recalcBtn'),initial={Kc:+document.querySelector('#kp').value,tauI:+document.querySelector('#ti').value,tauD:+document.querySelector('#td').value},loop_type=document.querySelector('#loopType').value;button.disabled=true;button.textContent='正在运行 V32…';activeRun=null;clearSdkResults('V32 正在计算');
  try{const form=new FormData();form.append('file',sourceCsvFile,sourceCsvFile.name||'input.csv');const analysis=await apiJson('/runs/analyze',{method:'POST',body:form});const result=await apiJson(`/runs/${analysis.run_id}/tune-v32`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...initial,loop_type})});if(!result.stage_sequence_available)throw Error('当前数据未匹配已核验的 V32 顺序 PI 链');const sequence={stage_count:result.stage_pid_sequence.length,rows:result.stage_pid_sequence,field_trial_eligible:result.field_trial_eligible};const waveforms=await apiJson(`/runs/${analysis.run_id}/v32-stage-waveforms`);validateV32Payload(sequence,waveforms,{runId:analysis.run_id,csvSha:sourceCsvSha256});setFinalPid(result.recommended_pid);activeRun={result,sequence,waveforms,run_id:analysis.run_id,csvSha:sourceCsvSha256};applySdkResult(sequence,waveforms);status(`V32 完成 · run_id ${analysis.run_id} · 16 Stage 同源校验通过`,true);toast('已显示本次运行的 V32 逐 Stage 波形')}catch(e){activeRun=null;clearSdkResults('当前运行没有可验证的对应波形');status('V32 波形拒绝显示：'+e.message);toast('V32 波形拒绝显示：'+e.message)}finally{button.disabled=false;button.textContent='运行 V32 分析'}
};
document.querySelector('#applyBtn').onclick=()=>{if(!activeRun){toast('没有 V32 有效结果');return}const s=activeRun.sequence.rows.at(-1);versions.unshift({time:'V32 开环验证准备 · '+new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V32 顺序 PI 链',params:`Stage 16 · Kc ${s.output_Kc} · tauI ${s.output_tauI_s}s · tauD 0`,state:'禁止直接投用'});renderHistory();toast('V32 建议已保存；不可直接写入 DCS')};
document.querySelector('#saveBtn').onclick=()=>activeRun?toast('V32 建议版本已保存'):toast('无可保存的 V32 结果');
status('请载入历史 CSV；参数、波形与指标将按同一运行严格校验');
