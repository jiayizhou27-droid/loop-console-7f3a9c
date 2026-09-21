const v29Stages=[
  [1,.25,55.2,0,.02193,300,1200,.01449,'开发'],[2,.25,55.2,0,.00676,60,1200,.00239,'开发'],
  [3,.25,46.9,0,.05636,60,1200,.03337,'开发'],[4,.25,39.9,0,.01369,600,1140,.00396,'开发'],
  [5,.25,39.9,0,.00887,420,1200,.00501,'开发'],[6,.25,39.9,0,.05746,720,1200,0,'开发'],
  [7,.25,39.9,0,.13609,60,1200,0,'开发'],[8,.25,39.9,0,.50172,60,1200,0,'开发'],
  [9,.25,39.9,0,.08638,360,840,0,'开发'],[10,.25,39.9,0,.00329,1020,1080,0,'开发'],
  [11,.25,39.9,0,.47394,120,1200,0,'开发'],[12,.25,39.9,0,.07681,600,1200,0,'开发'],
  [13,.25,39.9,0,.01467,240,1200,.01023,'开发'],[14,.25,39.9,0,.11282,60,1200,.01234,'开发'],
  [15,.25,48,0,.01343,720,1200,.00767,'开发'],[16,.25,43.2,0,.05807,60,1200,.00262,'密封测试']
];
function renderStages(){
  const target=document.querySelector('#stageRows');
  if(!target)return;
  const pct=v=>Number.isFinite(v)?(v*100).toFixed(2)+'%':'—';
  const sec=v=>Number.isFinite(v)?v.toFixed(0):'—';
  target.innerHTML=v29Stages.map(s=>`<tr><td>Stage ${String(s[0]).padStart(2,'0')}</td><td>${s[1].toFixed(4)}</td><td>${s[2].toFixed(1)}</td><td>${s[3].toFixed(1)}</td><td>${pct(s[4])}</td><td>${sec(s[5])}</td><td>${sec(s[6])}</td><td>${pct(s[7])}</td><td><span class="decision ${s[8]==='密封测试'?'hold':'accepted'}">${s[8]}</span></td><td><button class="stage-use" data-stage="${s[0]}">采用该阶段</button></td></tr>`).join('');
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{
    const s=v29Stages[Number(b.dataset.stage)-1];
    document.querySelector('#kp').value=s[1];
    document.querySelector('#ti').value=s[2];
    document.querySelector('#td').value=s[3];
    versions.unshift({time:`Stage ${s[0]} 建议 · `+new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V30 自整定',params:`Kc ${s[1]} · tauI ${s[2]} s · tauD ${s[3]} s`,state:'待人工确认'});
    renderHistory();
    toast(`Stage ${s[0]} 参数已暂存，未写入 DCS`);
  });
}
renderStages();
