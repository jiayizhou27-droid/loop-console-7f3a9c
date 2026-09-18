// English interview view. The controls and API values remain identical in both languages.
const englishView = new URLSearchParams(location.search).get('lang') === 'en';
window.pidLanguage = englishView ? 'en' : 'zh';

const translations = [
  ['PID TUNE · 控制回路工作台', 'PID TUNE · Control Loop Workbench'],
  ['面向控制工程师的历史性能评估与 PID 自整定工作台', 'Historical performance analysis and PID autotuning for control engineers'],
  ['化工过程控制回路性能与自整定', 'Chemical Process Control · Performance & Autotuning'],
  ['CSV 发送至已配置的 V30 服务', 'CSV sent to the configured V30 service'],
  ['本地计算', 'Offline analysis'],
  ['回路总览', 'Loop overview'], ['版本记录', 'Version history'],
  ['总览', 'Overview'], ['整定', 'Autotune'], ['记录', 'History'],
  ['历史性能评估', 'Historical performance'], ['导入 CSV 并诊断', 'Import CSV and diagnose'],
  ['拟合过程模型', 'Process model identification'], ['辨识增益、时滞与惯性', 'Identify dynamics and delay'],
  ['生成 PID 建议', 'Generate PID recommendations'], ['审阅、应用与回退', 'Review, apply and roll back'],
  ['反应器进料流量', 'Reactor feed flow'], ['未载入', 'No file loaded'],
  ['最大 50 MB', 'Max 50 MB'], ['SP、PV、MV 历史趋势图', 'Historical SP, PV and MV trend chart'], ['主导航', 'Main navigation'],
  ['导入历史 CSV 数据', 'Import historical CSV data'],
  ['拖放文件到此处，或', 'Drop a file here, or'], ['建议列：', 'Suggested columns: '],
  ['选择文件', 'Browse files'], ['选择 CSV', 'Choose CSV'], ['载入示例', 'Load sample'], ['导出报告', 'Export report'],
  ['回路响应示波器', 'Historical loop response oscilloscope'],
  ['SP 设定值', 'SP setpoint'], ['PV 过程值', 'PV process value'], ['MV 输出', 'MV output'],
  ['采样', 'Samples'], ['周期', 'Interval'], ['点', ' points'],
  ['综合性能', 'Loop health'], ['跟踪性能良好，扰动恢复略慢', 'Good tracking; disturbance recovery could improve'],
  ['回路跟踪稳定，可进一步优化响应速度', 'Stable tracking; response speed can be improved'],
  ['存在可优化空间，建议检查滞后与振荡', 'Improvement potential: inspect lag and oscillation'],
  ['跟踪精度', 'Tracking accuracy'], ['稳定性', 'Stability'], ['控制平稳度', 'Control smoothness'],
  ['积分绝对误差', 'Integral absolute error'], ['均方根误差', 'Root mean square error'],
  ['超调量', 'Overshoot'], ['峰值 / 设定值', 'Peak / setpoint'], ['需关注', 'Review required'],
  ['调节时间', 'Settling time'], ['进入 ±2% 带', 'Enter ±2% band'], ['目标 ≤', 'Target ≤'],
  ['振荡指数', 'Oscillation index'], ['PV 周期性强度', 'PV periodicity'], ['低风险', 'Low risk'], ['正常', 'Normal'],
  ['PID 自整定', 'PID autotuning'], ['建议值需经仿真或受控工况验证后应用', 'Validate recommendations in simulation or controlled operation before applying'],
  ['回路类型与 Cost Function', 'Loop type & cost function'], ['整定回路', 'Loop type'],
  ['流量 Flow', 'Flow'], ['压力 Pressure', 'Pressure'], ['温度 Temperature', 'Temperature'], ['液位 Level', 'Level'], ['通用 Generic', 'Generic'],
  ['弱比例、较强积分；关注快速消差，同时限制阀门频繁动作', 'Moderate gain and stronger integral action; reduce error while limiting valve movement'],
  ['未知对象采用均衡且保守的离线配置', 'Balanced, conservative offline profile for an unknown process'],
  ['优先限制压力超调并保持较快响应；高低限由硬安全门负责', 'Limit pressure overshoot while preserving response; hard limits are safety gated'],
  ['大惯性和纯滞后对象；不为短上升时间牺牲超调与稳定性', 'High-inertia, dead-time process; do not sacrifice stability for rise time'],
  ['库存缓冲对象允许慢响应；强烈抑制振荡和阀门动作', 'Inventory buffer permits slower response; suppress oscillation and valve movement'],
  ['权重合计', 'Total weight'], ['Kc 搜索范围', 'Kc search range'], ['初值', 'initial'],
  ['tauI 偏好', 'tauI preference'], ['较短', 'Shorter'], ['较长，建议 ≥', 'Longer, suggested ≥'], ['较长', 'Longer'], ['中性', 'Neutral'],
  ['恢复该回路默认值', 'Reset loop defaults'],
  ['输入自整定历史数据', 'Import autotuning history'], ['可复用上方数据，也可载入另一组 CSV', 'Reuse the file above or import another CSV'],
  ['V30 模型辨识与模式基准', 'V30 model identification & mode benchmark'], ['时间顺序开发集选型', 'Chronological development-set selection'],
  ['过程模型选择', 'Process model selection'], ['V30 自动辨识', 'V30 automatic identification'],
  ['候选阶次、延迟与 α 由 API 评估', 'API evaluates order, delay and α'], ['等待运行', 'Awaiting run'],
  ['开发集选型', 'Development-set selection'], ['按时间顺序切分，避免泄漏', 'Chronological split prevents leakage'],
  ['后端决定', 'Selected by backend'], ['密封测试', 'Sealed test'], ['仅展示当前运行返回的指标', 'Only current-run metrics are shown'],
  ['无预设值', 'No preset values'], ['模型阶次', 'Model order'], ['输入延迟', 'Input delay'],
  ['正则强度', 'Regularization strength'], ['数据切分', 'Data split'],
  ['V30 模式基准', 'V30 mode benchmark'], ['按当前 Cost Function 选择最优模式', 'Select the best mode for the current cost function'],
  ['保持初始参数，作为基准', 'Keep initial parameters as baseline'], ['仅调整比例增益 Kc', 'Adjust Kc only'],
  ['仅调整积分时间 tauI', 'Adjust tauI only'], ['Kc、tauI、tauD 联合自整定', 'Joint Kc, tauI and tauD autotuning'],
  ['等待后端计算', 'Awaiting API result'], ['后端未返回', 'Not returned by API'], ['已选', 'Selected'], ['候选', 'Candidate'], ['改善', 'improvement'],
  ['本次运行最终 PID 建议', 'Final PID recommendation for this run'], ['算法版本', 'Algorithm version'],
  ['比例增益', 'Proportional gain'], ['积分时间', 'Integral time'], ['微分时间', 'Derivative time'],
  ['等待 V30', 'Awaiting V30'], ['初始参数', 'Initial parameters'], ['当前回路 V30 结果', 'Current-loop V30 result'],
  ['未计算', 'Not calculated'], ['当前禁止直接投用', 'Not approved for direct deployment'],
  ['MV 边界来自离线历史估计，deployment_eligible=false。请补充真实 MV 上下限及速率，完成现场验证与操作员确认。', 'MV limits are estimated from offline history (deployment_eligible=false). Supply actual MV limits and rate, then complete field validation and operator approval.'],
  ['运行 V30 分析', 'Run V30 analysis'], ['保存建议版本', 'Save recommendation'], ['提交人工确认', 'Submit for operator review'],
  ['人工 PID 与自整定 PID 叠加对比示波器', 'Manual vs autotuned PID · comparison oscilloscope'],
  ['查看阶段', 'Select stage'], ['选择预测波形阶段', 'Select predicted-waveform stage'],
  ['请先运行 V30 分析', 'Run V30 analysis first'], ['请运行 V30 分析', 'Run V30 analysis'],
  ['人工 PID 预测 PV', 'Manual PID predicted PV'], ['自整定预测 PV', 'Autotuned predicted PV'],
  ['人工 MV', 'Manual MV'], ['自整定 MV', 'Autotuned MV'],
  ['同一阶段人工PID与自整定PID的SP、PV、MV叠加对比图', 'Same-stage SP, PV and MV overlay for manual and autotuned PID'],
  ['未计算：请载入 CSV 并运行当前回路模式', 'Not calculated: load a CSV and run the selected loop'],
  ['未计算：当前模式无有效 V30 返回', 'Not calculated: no valid V30 result for this mode'],
  ['阶段开始', 'Stage start'], ['阶段结束', 'Stage end'],
  ['全部阶段自整定 PID 建议', 'PID recommendations for every stage'],
  ['逐行读取 V30 SDK 的 stage_results；顶部仅显示整段运行的最终建议，不会再复制为各阶段结果。无法计算的指标显示“—”。', 'Each row comes from V30 stage_results. The top panel shows only the final recommendation; unavailable metrics appear as “—”.'],
  ['组自整定参数', 'autotuned parameter sets'], ['组人工对比', 'manual comparisons'], ['组人工参数', 'manual parameter sets'], ['组参数', 'parameter sets'], ['个阶段', 'stages'],
  ['自整定 Kc', 'Autotuned Kc'], ['自整定 tauI', 'Autotuned tauI'], ['自整定 tauD', 'Autotuned tauD'],
  ['上升时间', 'Rise time'], ['稳态误差', 'Steady-state error'], ['超调', 'Overshoot'],
  ['阶段用途', 'Stage decision'], ['操作', 'Action'],
  ['当前 CSV 尚未返回逐阶段整定结果。请连接 V30 服务并读取 stage_results。', 'No stage-by-stage results for this CSV. Connect the V30 service and read stage_results.'],
  ['已接受', 'Accepted'], ['保持', 'Hold'], ['采用该阶段', 'Use this stage'], ['未稳定', 'Not settled'],
  ['人工 PID', 'Manual PID'], ['自整定 PID', 'Autotuned PID'], ['人工', 'Manual'], ['自整定', 'Autotuned'],
  ['方案', 'Variant'], ['该 Stage 尚无人工 / 自整定同模型对比波形', 'No same-model manual/autotuned waveform for this stage'],
  ['参数版本与回退', 'Parameter versions & rollback'], ['回退到上一版本', 'Roll back to previous version'],
  ['版本 / 时间', 'Version / time'], ['算法', 'Algorithm'], ['参数', 'Parameters'], ['状态', 'Status'],
  ['V29 初始基准', 'V29 initial baseline'], ['当前运行', 'Current run'], ['运行中', 'Active'],
  ['待应用', 'Pending application'], ['待确认', 'Pending review'], ['待人工确认', 'Pending operator review'],
  ['查看', 'View'], ['回退', 'Roll back'], ['已恢复该版本参数，尚未下发', 'Version parameters restored locally; not sent to the DCS'],
  ['数据行不足', 'Insufficient data rows'], ['未找到 SP/PV 列', 'SP/PV columns not found'],
  ['个有效点', 'valid points'], ['已载入', 'Loaded'], ['复用性能评估数据', 'Reusing performance data'],
  ['数据解析完成；请运行 V30 API 生成当前回路结果', 'CSV parsed. Run the V30 API for the selected loop.'],
  ['读取失败：', 'Read failed: '], ['模式仅用于查看后端基准，不会填充写死参数', 'Mode selection displays the API benchmark; no preset PID values are inserted'],
  ['模型由 V30 后端按开发集误差自动选择，页面不使用预设数值', 'The V30 API selects the model by development error; this page uses no preset values'],
  ['建议参数已加入版本记录，可随时回退', 'Recommendation added to version history; rollback is available'],
  ['方案已保存到本地版本记录', 'Recommendation saved to local version history'],
  ['示例数据已载入；还未运行 V30', 'Sample data loaded; V30 has not run yet'],
  ['成本权重已修改', 'Cost weights changed'], ['旧整定结果已作废，请重新运行 V30', 'previous tuning result invalidated; rerun V30'],
  ['已切换为', 'Switched to'], ['已恢复当前回路默认权重', 'Loop default weights restored'],
  ['请先输入 SP / PV / MV 历史 CSV', 'Import historical SP / PV / MV CSV first'],
  ['正在运行 V30…', 'Running V30…'], ['后端返回模式', 'API returned loop'], ['期望', 'expected'],
  ['计算完成：', 'completed: '], ['V30 计算失败：', 'V30 calculation failed: '],
  ['当前模式没有后端验证结果，禁止保存', 'No API-validated result for this mode; saving is disabled'],
  ['V30 建议', 'V30 recommendation'], ['建议版本已保存 Cost Profile：', 'Recommendation saved with cost profile: '],
  ['回退仍需操作员确认', 'rollback still requires operator approval'], ['无可保存的有效 V30 返回', 'No valid V30 result to save'],
  ['建议', 'Recommendation'], ['参数已暂存，未写入 DCS', 'parameters staged locally; not written to the DCS'],
  ['等待运行', 'Awaiting run'], ['没有数据', 'No data'],
  ['超调', 'Overshoot'], ['平均误差', 'Mean error'], ['振荡', 'Oscillation'], ['MV动作', 'MV movement'], ['参数变化', 'Parameter change']
];

const orderedTranslations = translations.sort((a, b) => b[0].length - a[0].length);
function translateString(value) {
  if (!englishView || !value || !/[\u3400-\u9fff]/.test(value)) return value;
  let output = value;
  for (const [source, target] of orderedTranslations) output = output.split(source).join(target);
  return output;
}
window.pidTranslate = translateString;

function translateTree(root) {
  if (!englishView || !root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const next = translateString(root.nodeValue);
    if (next !== root.nodeValue) root.nodeValue = next;
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.matches('script,style')) return;
  for (const name of ['title', 'aria-label', 'placeholder']) {
    const old = root.getAttribute(name);
    if (old) {
      const next = translateString(old);
      if (next !== old) root.setAttribute(name, next);
    }
  }
  for (const child of root.childNodes) translateTree(child);
}

if (englishView) {
  document.documentElement.lang = 'en';
  document.title = translateString(document.title);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = translateString(description.content);
  translateTree(document.body);
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'characterData') translateTree(record.target);
      for (const added of record.addedNodes) translateTree(added);
    }
    observer.observe(document.body, {subtree: true, childList: true, characterData: true});
  });
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
}

const languageToggle = document.querySelector('#languageToggle');
if (languageToggle) {
  languageToggle.textContent = englishView ? '中文' : 'EN';
  languageToggle.onclick = () => {
    const next = new URL(location.href);
    if (englishView) next.searchParams.delete('lang');
    else next.searchParams.set('lang', 'en');
    location.assign(next.toString());
  };
}
