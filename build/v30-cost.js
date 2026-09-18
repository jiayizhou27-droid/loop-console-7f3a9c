const costProfiles={
 generic:{note:'未知对象采用均衡且保守的离线配置',range:'0.50–1.60 × 初值',tau:'中性',w:[20,22,15,8,17,10,5,3]},
 flow:{note:'弱比例、较强积分；关注快速消差，同时限制阀门频繁动作',range:'0.50–1.20 × 初值',tau:'较短',w:[12,27,18,8,12,14,6,3]},
 pressure:{note:'优先限制压力超调并保持较快响应；高低限由硬安全门负责',range:'0.50–1.40 × 初值',tau:'中性',w:[26,20,13,16,13,7,3,2]},
 temperature:{note:'大惯性和纯滞后对象；不为短上升时间牺牲超调与稳定性',range:'0.50–1.25 × 初值',tau:'较长',w:[24,20,12,5,21,8,7,3]},
 level:{note:'库存缓冲对象允许慢响应；强烈抑制振荡和阀门动作',range:'0.50–1.15 × 初值',tau:'较长，建议 ≥ 900 s',w:[8,10,10,2,12,27,20,11]}
};
const weightNames=['超调','稳态误差','平均误差','上升时间','调节时间','振荡','MV动作','参数变化'];
const weightKeys=['overshoot','steady','mean_error','rise','settling','oscillation','mv','parameter'];
const queryApi=new URLSearchParams(location.search).get('api');
const PID_API_BASE=(queryApi||window.PID_API_BASE||localStorage.getItem('pidApiBase')||'').replace(/\/$/,'');
let activeWeights=[...costProfiles.flow.w],activeRun=null;
function normalizeWeights(changed,value){const old=activeWeights[changed],rest=100-old,nextRest=100-value;activeWeights=activeWeights.map((v,i)=>i===changed?value:(rest?Math.max(0,v/rest*nextRest):nextRest/7));const sum=activeWeights.reduce((a,b)=>a+b,0);activeWeights[activeWeights.length-1]+=100-sum;renderCost()}
function renderCost(){const controls=document.querySelector('#weightControls'),plot=document.querySelector('#weightPlot');controls.innerHTML=weightNames.map((n,i)=>`<label class="weight-control"><span>${n}</span><input type="range" min="0" max="50" step="1" value="${Math.round(activeWeights[i])}" data-weight="${i}"><output>${activeWeights[i].toFixed(0)}%</output></label>`).join('');plot.innerHTML=weightNames.map((n,i)=>`<div class="weight-bar"><span>${n}</span><i><u style="width:${Math.min(100,activeWeights[i]*3)}%"></u></i><b>${activeWeights[i].toFixed(0)}%</b></div>`).join('');document.querySelector('#weightTotal').textContent=Math.round(activeWeights.reduce((a,b)=>a+b,0))+'%';document.querySelectorAll('[data-weight]').forEach(r=>r.oninput=()=>{normalizeWeights(+r.dataset.weight,+r.value);invalidateTuning('成本权重已修改')})}
function invalidateTuning(reason){activeRun=null;if(typeof clearStageResultsForNewData==='function')clearStageResultsForNewData();toast(reason+'；旧整定结果已作废，请重新运行 V30')}
function useProfile(key){const p=costProfiles[key];activeWeights=[...p.w];document.querySelector('#profileNote').textContent=p.note;document.querySelector('#kcRange').textContent=p.range;document.querySelector('#tauPreference').textContent=p.tau;renderCost()}
document.querySelector('#loopType').onchange=e=>{useProfile(e.target.value);invalidateTuning('已切换为 '+e.target.selectedOptions[0].text)};
document.querySelector('#resetWeights').onclick=()=>{useProfile(document.querySelector('#loopType').value);invalidateTuning('已恢复当前回路默认权重')};renderCost();
function apiUrl(path){return `${PID_API_BASE}${path}`}
const v30English=window.pidLanguage==='en';
function connectionStatus(state,zh,en){const element=document.querySelector('#v30Connection');element.dataset.state=state;element.textContent=v30English?en:zh}
function disconnectedStatus(){connectionStatus('error','V30 计算服务未连接。CSV 已可用于历史性能图，但模型、逐阶段 PID 和预测波形不会自动生成。GitHub Pages 不能运行 Python 算法服务。','V30 calculation service is not connected. The CSV can populate the historical chart, but the model, stage-by-stage PID and predicted waveforms cannot be generated. GitHub Pages cannot run the Python algorithm service.');document.querySelector('#stageScopeState').textContent='● V30 API NOT CONNECTED'}
window.onHistoricalCsvLoaded=()=>PID_API_BASE?connectionStatus('ready','历史 CSV 已就绪。点击“运行 V30 分析”才会将文件发送至配置的算法服务。','Historical CSV is ready. Click “Run V30 analysis” to send it to the configured algorithm service.'):disconnectedStatus();
if(PID_API_BASE)connectionStatus('ready','V30 服务地址已配置。请载入 CSV，再运行分析。','V30 service URL is configured. Import a CSV, then run the analysis.');else disconnectedStatus();
async function apiJson(path,options){const response=await fetch(apiUrl(path),options);const type=response.headers.get('content-type')||'';if(!type.includes('application/json'))throw Error(v30English?'The endpoint returned a web page, not the V30 API.':'接口返回的是网页，不是 V30 API。');let body;try{body=await response.json()}catch{throw Error(v30English?'The API returned invalid JSON.':'API 返回了无效 JSON。')}if(!response.ok)throw Error(typeof body.detail==='string'?body.detail:body.detail?JSON.stringify(body.detail):`HTTP ${response.status}`);return body}
document.querySelector('#recalcBtn').onclick=async()=>{
  if(!sourceCsvFile){toast('请先输入 SP / PV / MV 历史 CSV');return}
  if(!PID_API_BASE){disconnectedStatus();document.querySelector('#stageScopeState').textContent='● V30 API NOT CONNECTED';return}
  const button=document.querySelector('#recalcBtn'),loopType=document.querySelector('#loopType').value;
  button.disabled=true;button.textContent=v30English?'Running V30…':'正在运行 V30…';clearStageResultsForNewData();document.querySelector('#stageScopeState').textContent=`● REQUESTING ${loopType.toUpperCase()} API`;connectionStatus('running','正在检查 V30 服务并计算；请稍候。','Checking the V30 service and calculating; please wait.');
  try{
    const health=await apiJson('/health',{method:'GET'});
    if(health.status!=='ok'||!String(health.version||'').includes('V30'))throw Error(v30English?'This URL is not a V30 calculation service.':'此地址不是 V30 计算服务。');
    const form=new FormData();form.append('file',sourceCsvFile,sourceCsvFile.name||'input.csv');
    const analysis=await apiJson('/runs/analyze',{method:'POST',body:form});
    const weights=Object.fromEntries(weightKeys.map((key,i)=>[key,activeWeights[i]/100]));
    const result=await apiJson(`/runs/${encodeURIComponent(analysis.run_id)}/tune`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Kc:.25,tauI:48,tauD:0,loop_type:loopType,cost_weights:weights,reference_stage_pids:analysis.reference_stage_pids||null})});
    if(result.loop_type!==loopType)throw Error(`后端返回模式 ${result.loop_type}，期望 ${loopType}`);
    const waveforms=await apiJson(`/runs/${encodeURIComponent(analysis.run_id)}/stage-waveforms`);
    activeRun={runId:analysis.run_id,loopType};window.applyV30Result(result,waveforms);
    connectionStatus('success',`V30 计算完成：${result.stage_results.length} 个阶段。结果仅供离线审阅，现场投用仍需确认。`,`V30 calculation complete: ${result.stage_results.length} stages. Results are for offline review; field deployment still requires approval.`);
    toast(`V30 ${loopType} 计算完成：${result.stage_results.length} 个 Stage`);
  }catch(error){clearStageResultsForNewData();document.querySelector('#stageScopeState').textContent='● V30 API ERROR';connectionStatus('error',`V30 计算失败：${error.message}`,`V30 calculation failed: ${error.message}`);toast('V30 计算失败：'+error.message)}
  finally{button.disabled=false;button.textContent=v30English?'Run V30 analysis':'运行 V30 分析'}
};
document.querySelector('#applyBtn').onclick=()=>{if(!activeRun){toast('当前模式没有后端验证结果，禁止保存');return}const type=document.querySelector('#loopType').selectedOptions[0].text,weightAudit=weightNames.map((n,i)=>n+':'+activeWeights[i].toFixed(0)+'%').join(' / ');versions.unshift({time:'V30 建议 · '+new Date().toLocaleString('zh-CN',{hour12:false}),algo:`${type} · ${activeRun.runId}`,params:`Kc ${document.querySelector('#kp').value} · tauI ${document.querySelector('#ti').value} s · tauD ${document.querySelector('#td').value} s`,state:'待人工确认'});renderHistory();toast('建议版本已保存 Cost Profile：'+weightAudit)};
document.querySelector('#saveBtn').onclick=()=>activeRun?toast(`已保存 ${activeRun.loopType} / ${activeRun.runId}；回退仍需操作员确认`):toast('无可保存的有效 V30 返回');
