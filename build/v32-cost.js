let PID_API_BASE=localStorage.getItem('pidApiBaseV32')||'',activeRun=null;
const apiInput=document.querySelector('#apiBase');apiInput.value=PID_API_BASE;
const status=(message,ok=false)=>{const el=document.querySelector('#v30Connection');el.textContent=message;el.classList.toggle('good',ok)};
async function apiJson(path,options){if(!PID_API_BASE)throw Error('尚未连接 V32 算法服务');const r=await fetch(PID_API_BASE+path,options),body=await r.json().catch(()=>null);if(!r.ok)throw Error(body?.detail||`HTTP ${r.status}`);return body}
function setFinalPid(pid){if(!pid)return;document.querySelector('#kp').value=pid.Kc;document.querySelector('#ti').value=pid.tauI;document.querySelector('#td').value=pid.tauD||0;document.querySelector('#confidence').textContent='32-sequential-PI'}
async function loadBundledV32Results(){
  try{
    const [sequence,waveforms]=await Promise.all([fetch('v32_stage_pid_sequence.json',{cache:'no-store'}).then(r=>r.json()),fetch('stage_waveforms.json',{cache:'no-store'}).then(r=>r.json())]);
    const final=sequence.rows[sequence.rows.length-1];activeRun={sequence,waveforms,bundled:true};setFinalPid({Kc:final.output_Kc,tauI:final.output_tauI_s,tauD:0});applySdkResult(sequence,waveforms);
    status(`V32 顺序 PI 链已载入 · ${sequence.stage_count} 个 Stage · 开环验证准备`,true);
  }catch(e){status('V32 Stage 结果读取失败：'+e.message)}
}
document.querySelector('#connectApi').onclick=async()=>{PID_API_BASE=apiInput.value.trim().replace(/\/$/,'');if(!PID_API_BASE){status('请输入 V32 算法服务地址');return}try{const h=await apiJson('/health');localStorage.setItem('pidApiBaseV32',PID_API_BASE);status(`V32 算法服务已连接：${h.version}`,true);toast('V32 算法服务连接成功')}catch(e){status('连接失败：'+e.message);toast('V32 算法服务连接失败')}};
document.querySelector('#recalcBtn').onclick=async()=>{
  if(!PID_API_BASE){if(sourceCsvFile&&sourceCsvSha256!=='0d08f5033bb436709de43867f858e080b9b947dc2f157fba2b67b948dec7bbde'){status('该 CSV 不是 V32 准备包核验数据；请连接私有 V32 服务计算。');toast('未套用固定 Stage 结果');return}await loadBundledV32Results();toast('已载入 V32 核验 Stage PI 链');return}
  if(!sourceCsvFile){toast('请先输入 SP/PV/MV 历史 CSV');return}
  const button=document.querySelector('#recalcBtn'),initial={Kc:+document.querySelector('#kp').value,tauI:+document.querySelector('#ti').value,tauD:+document.querySelector('#td').value},loop_type=document.querySelector('#loopType').value;
  button.disabled=true;button.textContent='正在运行 V32…';clearSdkResults('V32 正在计算');
  try{const form=new FormData();form.append('file',sourceCsvFile,sourceCsvFile.name||'input.csv');const analysis=await apiJson('/runs/analyze',{method:'POST',body:form});const result=await apiJson(`/runs/${analysis.run_id}/tune-v32`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...initial,loop_type})});if(!result.stage_sequence_available)throw Error('当前数据未匹配已核验的 V32 顺序 PI 链');const sequence={stage_count:result.stage_pid_sequence.length,rows:result.stage_pid_sequence,field_trial_eligible:result.field_trial_eligible};setFinalPid(result.recommended_pid);const waveforms=await fetch('stage_waveforms.json',{cache:'no-store'}).then(r=>r.json());activeRun={result,sequence,waveforms};applySdkResult(sequence,waveforms);status(`V32 完成 · ${sequence.stage_count} 个 Stage · ${result.stage_sequence_status}`,true);toast('已显示 V32 逐阶段 PI 链')}catch(e){activeRun=null;clearSdkResults('V32 计算失败');status('V32 计算失败：'+e.message);toast('V32 计算失败：'+e.message)}finally{button.disabled=false;button.textContent='运行 V32 分析'}
};
document.querySelector('#applyBtn').onclick=()=>{if(!activeRun){toast('没有 V32 有效结果');return}const s=activeRun.sequence.rows.at(-1);versions.unshift({time:'V32 开环验证准备 · '+new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V32 顺序 PI 链',params:`Stage 16 · Kc ${s.output_Kc} · tauI ${s.output_tauI_s}s · tauD 0`,state:'禁止直接投用'});renderHistory();toast('V32 建议已保存；不可直接写入 DCS')};
document.querySelector('#saveBtn').onclick=()=>activeRun?toast('V32 建议版本已保存'):toast('无可保存的 V32 结果');
loadBundledV32Results();
