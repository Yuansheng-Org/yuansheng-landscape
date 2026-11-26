(() => {
  'use strict';

  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);

  const numberFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 });
  const percentFormat = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 });
  const signedPointsFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4, signDisplay: 'exceptZero' });
  const missing = '<span class="detail-missing">待补充</span>';
  const pending = '<span class="detail-missing">待判定</span>';
  const textValue = (value) => value == null || value === '' ? missing : escape(value);
  const numericValue = (value) => Number.isFinite(value) ? numberFormat.format(value) : missing;

  function levelBadge(level, levels) {
    return levels[level] && Number.isInteger(level)
      ? `<span class="detail-grade" data-level="${level}">L${level}</span>`
      : pending;
  }

  function softwareLink(url) {
    if (!url) return '';
    try {
      const homepage = new URL(url);
      if (homepage.protocol !== 'https:') return '';
      return `<a class="detail-project-link" href="${escape(homepage.href)}" target="_blank" rel="noopener noreferrer">项目主页<span class="detail-sr-only">（新窗口打开）</span></a>`;
    } catch {
      return '';
    }
  }

  function platformTable(rows) {
    if (!rows.length) return '<p class="detail-empty">暂无平台配置记录。</p>';
    return `<div class="detail-table-frame">
      <table class="detail-table detail-platform-table" aria-labelledby="detail-platform-title">
        <thead><tr><th scope="col">配置项</th><th scope="col">RISC-V</th><th scope="col">ARM</th></tr></thead>
        <tbody>${rows.map(({ label, target, reference }) => `<tr>
          <th scope="row">${escape(label)}</th><td>${textValue(target)}</td><td>${textValue(reference)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  function dimensionTable(dimensions, scores, levels) {
    if (!dimensions.length) return '<p class="detail-empty">暂无评价维度。</p>';
    return `<div class="detail-table-frame">
      <table class="detail-table detail-dimension-table" aria-labelledby="detail-level-title">
        <thead><tr><th scope="col">评价维度</th><th scope="col">成熟度得分</th><th scope="col">成熟度等级</th></tr></thead>
        <tbody>${dimensions.map((name, index) => {
          const result = scores[index];
          return `<tr><th scope="row">${escape(name)}</th>
            <td class="detail-numeric">${numericValue(result?.score)}</td><td>${levelBadge(result?.level, levels)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
  }

  function testsTable(tests) {
    if (!tests.length) return '<p class="detail-empty">暂无测试用例性能记录。</p>';
    return `<div class="detail-table-frame">
      <table class="detail-table detail-tests-table" aria-labelledby="detail-tests-title">
        <thead><tr>
          <th scope="col">测试用例</th><th scope="col">指标</th><th scope="col">RISC-V</th><th scope="col">ARM</th><th scope="col">单位</th>
        </tr></thead>
        <tbody>${tests.map(({ name, metric, unit, target, reference }) => `<tr>
          <th scope="row">${escape(name)}</th><td>${textValue(metric)}</td>
          <td class="detail-numeric">${numericValue(target)}</td><td class="detail-numeric">${numericValue(reference)}</td>
          <td>${textValue(unit)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  function comparisonCard({ title, name, metric, before, after, unit, changeLabel, changeValue, improved }) {
    const rows = [['优化前', before], ['优化后', after]];
    return `<div class="detail-optimization-card">
      <h3>${title}</h3>
      <p class="detail-optimization-subject">${escape(name)}${metric ? ` · ${escape(metric)}` : ''}</p>
      <dl class="detail-comparison-values">
        ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${numericValue(value)}${Number.isFinite(value) && unit ? `<small>${escape(unit)}</small>` : ''}</dd></div>`).join('')}
      </dl>
      ${changeValue === null ? '' : `<p class="detail-change"${improved ? ' data-improved="true"' : ''}>
        <span>${escape(changeLabel)}</span><strong>${changeValue}</strong>
      </p>`}
    </div>`;
  }

  function optimizationSection({ summary, performance, maturity }) {
    const relativeChange = performance.before > 0 && Number.isFinite(performance.after)
      ? (performance.after - performance.before) / performance.before
      : null;
    const performanceLabel = relativeChange === 0 ? '性能指标持平'
      : `${performance.metric}${relativeChange < 0 ? '下降' : '上升'}`;
    const pointChange = Number.isFinite(maturity.before) && Number.isFinite(maturity.after)
      ? maturity.after - maturity.before
      : null;

    return `<section class="detail-section detail-optimization" aria-labelledby="detail-optimization-title">
      <h2 id="detail-optimization-title">优化详情</h2>
      <p>${escape(summary)}</p>
      <div class="detail-optimization-grid">
        ${comparisonCard({
          ...performance,
          title: 'RISC-V 性能对比',
          changeLabel: performanceLabel,
          changeValue: relativeChange === null ? null : percentFormat.format(Math.abs(relativeChange)),
          improved: performance.lowerIsBetter ? relativeChange < 0 : relativeChange > 0,
        })}
        ${comparisonCard({
          ...maturity,
          title: '成熟度得分对比',
          unit: '分',
          changeLabel: pointChange > 0 ? '得分提升' : pointChange < 0 ? '得分下降' : '得分持平',
          changeValue: pointChange === null ? null : `${signedPointsFormat.format(pointChange)} 分`,
          improved: pointChange > 0,
        })}
      </div>
    </section>`;
  }

  window.renderSoftwareDetail = function renderSoftwareDetail(pkg, isExample) {
    const { levels, dimensions, platformRows } = window.LandscapeData;
    const stage = isExample ? undefined : pkg.stage;
    const unassessed = stage?.assessed === false;
    const optimization = !isExample && pkg.optimization;
    const current = Number.isInteger(pkg.level) ? levels[pkg.level] : undefined;

    return `<article class="detail-page" aria-labelledby="detail-title">
      <nav class="detail-path" aria-label="当前位置">
        <a href="${isExample ? '#scenarios' : '#catalog'}" class="detail-back">${isExample ? '场景' : '软件目录'}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escape(pkg.name)}</span>
      </nav>

      <header class="detail-hero">
        ${window.renderSoftwareMark(pkg, 'detail-mark')}
        <div class="detail-heading">
          <p class="detail-category">${escape(pkg.layer)}${stage ? `<span class="detail-stage" data-stage="${escape(stage.id)}">${escape(stage.label)}</span>` : ''}<span>模拟数据</span></p>
          <h1 id="detail-title" tabindex="-1">${escape(pkg.name)}</h1>
          ${pkg.summary ? `<p class="detail-description">${escape(pkg.summary)}</p>` : ''}
        </div>
        ${softwareLink(pkg.homepage)}
      </header>

      ${unassessed ? `<dl class="detail-overall" aria-label="成熟度评估状态">
        <dt>成熟度评估</dt><dd><strong class="detail-assessment-status">尚未评估</strong></dd>
      </dl>` : `<dl class="detail-overall" aria-label="整体评级">
        <dt>成熟度等级</dt>
        <dd>${levelBadge(pkg.level, levels)}${current ? `<strong>${escape(current.name)}</strong>` : ''}</dd>
      </dl>`}

      ${optimization ? optimizationSection(optimization) : ''}

      <section class="detail-section" aria-labelledby="detail-platform-title">
        <h2 id="detail-platform-title">评估平台</h2>
        ${platformTable(pkg.platformRows ?? platformRows)}
      </section>

      ${unassessed ? '' : `<section class="detail-section" aria-labelledby="detail-level-title">
        <h2 id="detail-level-title">等级判定</h2>
        ${current?.description ? `<p>${escape(current.description)}</p>` : ''}
        <ol class="detail-levels" aria-label="成熟度等级">
          ${levels.map((level, index) => `<li data-level="${index}"${index === pkg.level ? ' aria-current="step"' : ''}>
            <strong>L${index}</strong><span>${escape(level.name)}</span>
          </li>`).join('')}
        </ol>
        ${dimensionTable(dimensions, pkg.scores ?? [], levels)}
      </section>`}

      <section class="detail-section" aria-labelledby="detail-tests-title">
        <h2 id="detail-tests-title">测试用例性能详情</h2>
        <p>模拟读数，用于展示 RISC-V 与 ARM 的性能对比。</p>
        ${testsTable(pkg.tests ?? [])}
      </section>
    </article>`;
  };
})();
