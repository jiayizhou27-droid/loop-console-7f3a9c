const v29Stages=[[1,.25,55.2,0,1,.0143,'开发'],[2,.25,55.2,0,0,.0159,'开发'],[3,.25,46.9,0,-1,.0512,'开发'],[4,.25,39.9,0,-1,.0064,'开发'],[5,.25,39.9,0,0,.0117,'开发'],[6,.25,39.9,0,0,.055,'开发'],[7,.25,39.9,0,0,.0016,'开发'],[8,.25,39.9,0,0,.0104,'开发'],[9,.25,39.9,0,0,0,'开发'],[10,.25,39.9,0,0,.0418,'开发'],[11,.25,39.9,0,0,.0321,'开发'],[12,.25,39.9,0,0,.0034,'开发'],[13,.25,39.9,0,0,.0045,'开发'],[14,.25,39.9,0,0,.006,'开发'],[15,.25,48,0,1,.0048,'开发'],[16,.25,43.2,0,-1,.0032,'密封测试']];
function renderStages(){
  const target=document.querySelector('#stageRows');
  if(!target)return;
  target.innerHTML=v29Stages.map(s=>`<tr><td>Stage ${String(s[0]).padStart(2,'0')}</td><td>${s[1].toFixed(4)}</td><td>${s[2].toFixed(1)}</td><td>${s[3].toFixed(1)}</td><td>${s[4]}</td><td>${(s[5]*100).toFixed(2)}%</td><td><span class="decision ${s[6]==='密封测试'?'hold':'accepted'}">${s[6]}</span></td><td><button class="stage-use" data-stage="${s[0]}">采用该阶段</button></td></tr>`).join('');
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{
    const s=v29Stages[Number(b.dataset.stage)-1];
    document.querySelector('#kp').value=s[1];
    document.querySelector('#ti').value=s[2];
    document.querySelector('#td').value=s[3];
    versions.unshift({time:`Stage ${s[0]} 建议 · `+new Date().toLocaleString('zh-CN',{hour12:false}),algo:'V29 自整定',params:`Kc ${s[1]} · tauI ${s[2]} s · tauD ${s[3]} s`,state:'待人工确认'});
    renderHistory();
    toast(`Stage ${s[0]} 参数已暂存，未写入 DCS`);
  });
}
renderStages();
