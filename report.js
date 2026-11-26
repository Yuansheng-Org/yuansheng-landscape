(() => {
  "use strict";

  const escape = (value) => String(value ?? "—").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const dimensions = {
    community: "开源社区支持", functional: "功能完整性", performance: "性能先进性",
    stability: "运行稳定性", architecture: "架构配置兼容性",
  };
  const labels = {
    scored: "已评分", unknown: "待判定", exempt: "已豁免", provisional: "初评",
    waiver_pending: "豁免待确认", waiver_denied: "豁免未通过",
    succeeded: "成功", failed: "失败", cancelled: "已取消",
    pass: "通过", fail: "失败", skip: "跳过", other: "其他",
  };

  function title(report) {
    const a = report.assessment;
    const parts = [report.date, ...Object.values(report.platforms)];
    if (a) parts.push(a.version, `评估 #${a.id} r${a.revision}`, a.confirmed ? `已确认 ${a.level}` : "未确认");
    else parts.push("测试记录");
    return parts.join(" · ");
  }

  function table(headings, rows) {
    return `<div class="detail-table-frame"><table class="detail-table"><thead><tr>${headings.map((h) =>
      `<th scope="col">${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) =>
      `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderAssessment(a) {
    if (!a) return "";
    return `<section class="detail-section"><h2>${a.confirmed ? "已确认评级" : "未确认快照"} · ${escape(a.level ?? "待判定")}</h2>
      <p>软件版本 ${escape(a.version)} · 规则 ${escape(a.rule_version)} · 快照 #${a.id} r${a.revision}</p>
      ${table(["评价维度", "状态", "得分（0–1）", "初评分"], Object.entries(dimensions).map(([key, label]) => {
        const d = a.dimensions[key];
        return [label, labels[d.status], d.score, d.provisional_score];
      }))}
      ${a.timings.length ? table(["评级负载", "RISC-V 均值（秒）", "ARM 均值（秒）", "RV 重复数", "ARM 重复数"],
        a.timings.map((m) => [m.name, m.rv_seconds, m.arm_seconds, m.rv_repetitions, m.arm_repetitions])) : ""}
      </section>`;
  }

  function pairedMeasurements(runs) {
    if (runs.length !== 2 || new Set(runs.map((r) => r.arch)).size !== 2) return "";
    const rows = new Map();
    for (const run of runs) {
      for (const m of run.measurements) {
        const key = JSON.stringify([m.case, m.metric, m.variant, m.unit, m.unit ? null : run.arch]);
        const row = rows.get(key) ?? { measurement: m };
        row[run.arch] = m;
        rows.set(key, row);
      }
    }
    if (!rows.size) return "";
    const cells = [...rows.values()].map(({ measurement: m, riscv64, arm64 }) =>
      [m.case, m.metric, m.variant, m.unit, riscv64?.mean, riscv64?.samples, arm64?.mean, arm64?.samples]);
    return `<section class="detail-section"><h2>跨平台性能对比</h2>${table(
      ["用例", "指标", "版本", "单位", "RISC-V 均值", "样本数（RV）", "ARM 均值", "样本数（ARM）"], cells)}</section>`;
  }

  function renderRun(run, paired) {
    const cases = Object.entries(run.functional).map(([key, n]) => `${labels[key]} ${n}`).join(" · ");
    return `<section class="detail-section"><h2>${escape(run.platform || run.arch)} · Run #${run.id}</h2>
      <p>${escape(run.arch)} · ${escape(labels[run.status])} · 重跑代次 ${run.generation}${run.created_at ? " · " + escape(run.created_at) : ""}</p>
      <p>配方 ${escape(run.recipe)} · 基线提交 ${escape(run.commit)}</p>
      ${run.patch_sha256 ? `<p>补丁 SHA-256 <code>${escape(run.patch_sha256)}</code></p>` : ""}
      ${cases ? `<p>功能用例 · ${escape(cases)}</p>` : ""}
      ${!run.measurements.length ? '<p class="detail-empty">本次记录没有性能读数。</p>' : paired ? "" : table(["用例", "指标", "版本", "均值", "单位", "样本数"],
        run.measurements.map((m) => [m.case, m.metric, m.variant, m.mean, m.unit, m.samples]))}</section>`;
  }

  function selected(pkg, id) {
    return id ? pkg.reports.find((report) => report.id === id) : pkg.current;
  }

  window.renderReportPage = function (pkg, id) {
    const report = selected(pkg, id);
    return `<article class="detail-page">
      <nav class="detail-path" aria-label="当前位置"><a href="#catalog" class="detail-back">软件目录</a> / ${escape(pkg.name)}</nav>
      <header class="detail-hero">${window.renderSoftwareMark(pkg, "detail-mark")}
        <div class="detail-heading"><p class="detail-category">${escape(pkg.layer)}</p>
        <h1 id="detail-title" tabindex="-1">${escape(pkg.name)}</h1></div></header>
      ${pkg.reports.length ? `<section class="detail-section"><h2>测试结果（${pkg.reports.length}）</h2>
        <label>选择记录 <select id="report-picker">${pkg.reports.map((r) =>
          `<option value="${r.id}" ${r === report ? "selected" : ""}>${escape(title(r))} · ${r.id.slice(0, 8)}</option>`).join("")}</select></label>
        ${report ? `<p><a href="results/${report.id}.json" download>下载原始结果 JSON</a></p>` : ""}
        </section>` : ""}
      <div id="report-body" aria-live="polite">${report ? "正在读取测试结果…" : id ? "未找到该条结果。" : "暂无已提交的测试记录。"}</div></article>`;
  };

  window.loadSelectedReport = async function (detail, pkg, id) {
    const picker = detail.querySelector("#report-picker");
    const report = selected(pkg, id);
    if (picker) picker.onchange = () => { location.hash = `software/${pkg.id}/${picker.value}`; };
    if (!report) return;
    // Keep the element belonging to this route; a slower response cannot replace another selection.
    const panel = detail.querySelector("#report-body");
    try {
      const response = await fetch(`results/${report.id}.json`);
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      if (data.result_id !== report.id || data.software_id !== pkg.id) throw new Error("result mismatch");
      const paired = pairedMeasurements(data.runs);
      panel.innerHTML = renderAssessment(data.assessment)
        + data.runs.map((run) => renderRun(run, Boolean(paired))).join("") + paired;
    } catch {
      panel.textContent = "读取测试结果失败，请刷新页面重试。";
    }
  };
})();
