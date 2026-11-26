(() => {
  'use strict';

  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);

  const numberFormat = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 });
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

  window.renderScenarioExample = function renderScenarioExample(pkg) {
    const { levels, dimensions, platformRows } = window.LandscapeData;
    const current = Number.isInteger(pkg.level) ? levels[pkg.level] : undefined;

    return `<article class="detail-page" aria-labelledby="detail-title">
      <nav class="detail-path" aria-label="当前位置">
        <a href="#scenarios" class="detail-back">场景</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escape(pkg.name)}</span>
      </nav>

      <header class="detail-hero">
        ${window.renderSoftwareMark(pkg, 'detail-mark')}
        <div class="detail-heading">
          <p class="detail-category">${escape(pkg.layer)}<span>模拟数据</span></p>
          <h1 id="detail-title" tabindex="-1">${escape(pkg.name)}</h1>
          ${pkg.summary ? `<p class="detail-description">${escape(pkg.summary)}</p>` : ''}
        </div>
        ${softwareLink(pkg.homepage)}
      </header>

      <dl class="detail-overall" aria-label="整体评级">
        <dt>成熟度等级</dt>
        <dd>${levelBadge(pkg.level, levels)}${current ? `<strong>${escape(current.name)}</strong>` : ''}</dd>
      </dl>

      <section class="detail-section" aria-labelledby="detail-platform-title">
        <h2 id="detail-platform-title">评估平台</h2>
        ${platformTable(pkg.platformRows ?? platformRows)}
      </section>

      <section class="detail-section" aria-labelledby="detail-level-title">
        <h2 id="detail-level-title">等级判定</h2>
        ${current?.description ? `<p>${escape(current.description)}</p>` : ''}
        <ol class="detail-levels" aria-label="成熟度等级">
          ${levels.map((level, index) => `<li data-level="${index}"${index === pkg.level ? ' aria-current="step"' : ''}>
            <strong>L${index}</strong><span>${escape(level.name)}</span>
          </li>`).join('')}
        </ol>
        ${dimensionTable(dimensions, pkg.scores ?? [], levels)}
      </section>

      <section class="detail-section" aria-labelledby="detail-tests-title">
        <h2 id="detail-tests-title">测试用例性能详情</h2>
        <p>模拟读数，用于展示 RISC-V 与 ARM 的性能对比。</p>
        ${testsTable(pkg.tests ?? [])}
      </section>
    </article>`;
  };
})();
