const costProfiles={
 generic:{note:'未知对象采用均衡且保守的离线配置',range:'0.50–1.60 × 初值',tau:'中性',w:[20,22,15,8,17,10,5,3]},
 flow:{note:'弱比例、较强积分；关注快速消差，同时限制阀门频繁动作',range:'0.50–1.20 × 初值',tau:'较短',w:[12,27,18,8,12,14,6,3]},
 pressure:{note:'优先限制压力超调并保持较快响应；高低限由硬安全门负责',range:'0.50–1.40 × 初值',tau:'中性',w:[26,20,13,16,13,7,3,2]},
 temperature:{note:'大惯性和纯滞后对象；不为短上升时间牺牲超调与稳定性',range:'0.50–1.25 × 初值',tau:'较长',w:[24,20,12,5,21,8,7,3]},
 level:{note:'库存缓冲对象允许慢响应；强烈抑制振荡和阀门动作',range:'0.50–1.15 × 初值',tau:'较长，建议 ≥ 900 s',w:[8,10,10,2,12,27,20,11]}
};
const weightNames=['超调','稳态误差','平均误差','上升时间','调节时间','振荡','MV动作','参数变化'];
let activeWeights=[...costProfiles.flow.w];
function normalizeWeights(changed,value){const old=activeWeights[changed],rest=100-old,nextRest=100-value;activeWeights=activeWeights.map((v,i)=>i===changed?value:(rest?Math.max(0,v/rest*nextRest):nextRest/7));const sum=activeWeights.reduce((a,b)=>a+b,0);activeWeights[activeWeights.length-1]+=100-sum;renderCost()}
function renderCost(){const controls=document.querySelector('#weightControls'),plot=document.querySelector('#weightPlot');controls.innerHTML=weightNames.map((n,i)=>`<label class="weight-control"><span>${n}</span><input type="range" min="0" max="50" step="1" value="${Math.round(activeWeights[i])}" data-weight="${i}"><output>${activeWeights[i].toFixed(0)}%</output></label>`).join('');plot.innerHTML=weightNames.map((n,i)=>`<div class="weight-bar"><span>${n}</span><i><u style="width:${Math.min(100,activeWeights[i]*3)}%"></u></i><b>${activeWeights[i].toFixed(0)}%</b></div>`).join('');document.querySelector('#weightTotal').textContent=Math.round(activeWeights.reduce((a,b)=>a+b,0))+'%';document.querySelectorAll('[data-weight]').forEach(r=>r.oninput=()=>normalizeWeights(+r.dataset.weight,+r.value))}
function useProfile(key){const p=costProfiles[key];activeWeights=[...p.w];document.querySelector('#profileNote').textContent=p.note;document.querySelector('#kcRange').textContent=p.range;document.querySelector('#tauPreference').textContent=p.tau;renderCost();toast('已加载 '+document.querySelector('#loopType').selectedOptions[0].text+' Cost Profile')}
document.querySelector('#loopType').onchange=e=>useProfile(e.target.value);document.querySelector('#resetWeights').onclick=()=>useProfile(document.querySelector('#loopType').value);renderCost();
document.querySelector('#recalcBtn').onclick=()=>{if(!dataset.length){toast('请先输入 SP / PV / MV 历史 CSV');return}analyze(dataset);toast('历史性能已重算；逐阶段 PID 仅接受 V30 stage_results 返回值')};
document.querySelector('#applyBtn').onclick=()=>{const type=document.querySelector('#loopType').selectedOptions[0].text,weightAudit=weightNames.map((n,i)=>n+':'+activeWeights[i].toFixed(0)+'%').join(' / ');versions.unshift({time:'V30 建议 · '+new Date().toLocaleString('zh-CN',{hour12:false}),algo:type,params:`Kc ${document.querySelector('#kp').value} · tauI ${document.querySelector('#ti').value} s · tauD ${document.querySelector('#td').value} s`,state:'待人工确认'});renderHistory();toast('建议版本已保存 Cost Profile：'+weightAudit)};
document.querySelector('#saveBtn').onclick=()=>toast('V30 建议与当前 Cost Profile 已保存；回退仍需操作员确认');
