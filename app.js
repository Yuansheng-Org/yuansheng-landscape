(() => {
  "use strict";

  const { packages: scenarioExamples, levels, scenarios } = window.LandscapeData;
  const packages = window.SoftwareCatalog;
  const stageCounts = window.SoftwareProgressStages.map((stage) => ({
    ...stage,
    count: packages.filter((pkg) => pkg.stage.id === stage.id).length,
  }));
  const assessedPackages = packages.filter((pkg) => pkg.stage.assessed);
  const levelCounts = levels.map((_, index) => assessedPackages.filter((pkg) => pkg.level === index).length);
  const assessmentLevel = ({ stage, level }) => stage.assessed ? level : null;
  const layers = [...new Set(packages.map((pkg) => pkg.layer))];
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const packageLink = (id, route = "software") => `#${route}/${encodeURIComponent(id)}`;
  const exampleById = new Map(scenarioExamples.map((pkg) => [pkg.id, pkg]));
  const catalogTitle = document.title;
  const pageSize = 8;
  const state = { page: 1, level: null, sort: null, direction: "ascending" };
  const search = byId("software-search");
  const layer = byId("layer-select");
  const rows = byId("software-rows");
  const legend = byId("level-legend");
  const chartFilters = byId("chart-filters");
  const navigation = [...document.querySelectorAll("[aria-label='主导航'] a")];
  const sortButtons = [...document.querySelectorAll("[data-sort]")];
  const subpages = ["scenarios", "standards", "platform"];
  const catalog = byId("catalog-view");
  const detail = byId("detail-view");

  function badge(level) {
    if (!Number.isInteger(level) || !levels[level]) return '<span class="section-note">待判定</span>';
    return `<span class="level-badge" data-level="${level}">L${level}</span><span class="level-label">${escapeHtml(levels[level].name)}</span>`;
  }

  for (const name of layers) layer.add(new Option(name, name));

  function renderProgress() {
    const total = packages.length;
    const measured = packages.filter((pkg) => pkg.reports.length).length;
    const segments = stageCounts.map((stage) => ({
      ...stage,
      share: total ? stage.count / total * 100 : 0,
    }));
    byId("package-total").textContent = total;
    byId("progress-bar").innerHTML = segments.map(({ id, count, share }) => count
      ? `<span data-stage="${id}" style="flex:${count}">${share >= 15 ? `${share.toFixed(1)}%` : ""}</span>`
      : "").join("");
    byId("progress-legend").innerHTML = segments.map(({ id, label, count, share }) => `
      <li data-stage="${id}">
        <span class="progress-legend-name">${escapeHtml(label)}</span>
        <span class="progress-legend-data"><strong>${count} 项</strong> · ${share.toFixed(1)}%</span>
      </li>`).join("");
    for (const [id, count] of [["measured", measured], ["assessed", assessedPackages.length], ["reports", window.LandscapeReports.length]]) {
      byId(`progress-${id}`).innerHTML = `<strong>${count}</strong> 项`;
    }
  }

  function renderLevelChart() {
    const selected = state.level;
    const focusIndex = legend.contains(document.activeElement) ? document.activeElement.dataset.level : null;
    const assessed = assessedPackages.length;
    byId("rating-count").textContent = `已确认评级 ${assessed} 项`;

    byId("level-bar").innerHTML = levelCounts.map((count, index) => count
      ? `<span class="${selected !== null && selected !== index ? "dimmed" : ""}"
               data-level="${index}" style="flex:${count}"></span>` : "").join("");

    legend.innerHTML = levelCounts.map((count, index) => {
      const title = `L${index} ${levels[index].name}`;
      const share = assessed ? (count / assessed * 100).toFixed(1) : null;
      const label = `${title}，${count} 项${share === null ? "" : `，占 ${share}%`}`;
      return `<button class="legend-item" type="button" data-level="${index}"
                  ${count ? "" : "disabled"}
                  aria-pressed="${selected === index}" aria-label="${escapeHtml(label)}">
                <span class="legend-name">L${index}<span class="legend-title">${escapeHtml(levels[index].name)}</span></span>
                <span class="legend-data"><b>${count} 项</b>${share === null ? "" : `<span class="legend-divider" aria-hidden="true"> · </span><span class="legend-share">${share}%</span>`}</span>
              </button>`;
    }).join("");
    if (focusIndex !== null) legend.querySelector(`[data-level="${focusIndex}"]`)?.focus();
  }

  function renderCatalog() {
    const term = search.value.trim().toLowerCase();
    const selectedLayer = layer.value;
    const results = packages.filter((pkg) => (
      (!term || `${pkg.name} ${pkg.layer}`.toLowerCase().includes(term))
      && (!selectedLayer || pkg.layer === selectedLayer)
      && (state.level === null || assessmentLevel(pkg) === state.level)
    ));
    if (state.sort) {
      const order = state.direction === "ascending" ? 1 : -1;
      results.sort((a, b) => {
        if (state.sort === "name") return order * a.name.localeCompare(b.name, "en");
        const left = assessmentLevel(a);
        const right = assessmentLevel(b);
        if (left === null || right === null) return Number(left === null) - Number(right === null);
        return order * (left - right);
      });
    }
    for (const button of sortButtons) {
      const heading = button.closest("th");
      if (button.dataset.sort === state.sort) heading.setAttribute("aria-sort", state.direction);
      else heading.removeAttribute("aria-sort");
    }

    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = (state.page - 1) * pageSize;
    const visible = results.slice(start, start + pageSize);
    rows.innerHTML = visible.map((pkg) => `
      <tr data-software="${packageLink(pkg.id)}">
        <td><a class="software-link" href="${packageLink(pkg.id)}">
          ${window.renderSoftwareMark(pkg, `package-mark mark-${layers.indexOf(pkg.layer) % 5}`)}
          <span class="software-name">${escapeHtml(pkg.name)}<small class="software-category">${escapeHtml(pkg.layer)}</small></span>
        </a></td>
        <td class="category-column">${escapeHtml(pkg.layer)}</td>
        <td>${pkg.stage.assessed ? badge(pkg.level)
          : `<span class="stage-badge">${escapeHtml(pkg.stage.label)}</span>`}</td>
        <td>${escapeHtml(pkg.platforms.riscv64 ?? "—")}</td>
        <td>${escapeHtml(pkg.platforms.arm64 ?? "—")}</td>
        <td class="row-end" aria-hidden="true"><span class="row-chevron"></span></td>
      </tr>`).join("");

    byId("result-count").textContent = `${results.length} 项软件`;
    byId("reset-filters").hidden = !(search.value || selectedLayer || state.level !== null);
    byId("table-wrap").hidden = !results.length;
    byId("empty-state").hidden = !!results.length;
    byId("pagination").hidden = pageCount === 1;
    byId("page-summary").textContent = `显示 ${start + 1}–${start + visible.length} 项，共 ${results.length} 项`;
    byId("page-number").textContent = `${state.page} / ${pageCount}`;
    byId("prev-page").disabled = state.page === 1;
    byId("next-page").disabled = state.page === pageCount;
    chartFilters.hidden = state.level === null;
    chartFilters.innerHTML = state.level === null ? "" : `
      <button type="button" class="filter-tag" data-level="${state.level}" aria-label="移除等级筛选">
        等级 L${state.level} · ${escapeHtml(levels[state.level].name)} <span aria-hidden="true">×</span>
      </button>`;
  }

  function filterChanged() {
    state.page = 1;
    renderCatalog();
  }

  function clearFilters() {
    search.value = "";
    layer.value = "";
    state.level = null;
    renderLevelChart();
    filterChanged();
    search.focus();
  }

  byId("scenario-list").innerHTML = scenarios.map((scenario) => {
    const components = scenario.componentIds.map((id) => exampleById.get(id)).filter(Boolean);
    return `<article class="scenario-card">
      <header><h2>${escapeHtml(scenario.name)}</h2><span>${badge(scenario.level)}</span></header>
      <ul class="scenario-components" aria-label="软件组件">${components.map((pkg) =>
        `<li><a href="${packageLink(pkg.id, packages.some((p) => p.id === pkg.id && p.current) ? "software" : "example")}">${escapeHtml(pkg.name)}</a></li>`).join("")}</ul>
    </article>`;
  }).join("");

  function showPage() {
    const hash = window.location.hash.slice(1);
    const isExample = hash.startsWith("example/");
    const isDetail = isExample || hash.startsWith("software/");
    catalog.hidden = isDetail || subpages.includes(hash);
    detail.hidden = !isDetail;
    for (const page of subpages) byId(`${page}-view`).hidden = hash !== page;
    const navTarget = isExample ? "#scenarios" : subpages.includes(hash) ? `#${hash}` : "#catalog";
    for (const link of navigation) {
      if (link.getAttribute("href") === navTarget) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }

    let heading;
    document.title = catalogTitle;
    if (isDetail) {
      const [id, reportId] = hash.slice(hash.indexOf("/") + 1).split("/");
      const records = isExample ? scenarioExamples : packages;
      const pkg = records.find((item) => encodeURIComponent(item.id) === id);
      detail.innerHTML = pkg ? (isExample ? window.renderScenarioExample(pkg) : window.renderReportPage(pkg, reportId)) : (
        '<div class="not-found"><h1 id="detail-title" tabindex="-1">未找到该软件</h1><a href="#catalog">返回软件目录</a></div>'
      );
      if (pkg && !isExample) window.loadSelectedReport(detail, pkg, reportId);
      document.title = `${pkg?.name ?? "未找到该软件"} · 源生 Landscape v0.8`;
      heading = byId("detail-title");
    } else if (subpages.includes(hash)) {
      heading = byId(`${hash}-title`);
      document.title = `${heading.textContent} · 源生 Landscape v0.8`;
    }

    if (hash === "catalog") {
      byId("catalog").scrollIntoView();
      byId("directory-title").focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      heading?.focus({ preventScroll: true });
    }
  }

  search.addEventListener("input", filterChanged);
  layer.addEventListener("change", filterChanged);
  for (const id of ["reset-filters", "empty-reset"]) byId(id).addEventListener("click", clearFilters);
  legend.addEventListener("click", (event) => {
    const button = event.target.closest("[data-level]");
    if (!button) return;
    const selected = Number(button.dataset.level);
    state.level = state.level === selected ? null : selected;
    renderLevelChart();
    filterChanged();
  });
  chartFilters.addEventListener("click", (event) => {
    if (!event.target.closest("button")) return;
    state.level = null;
    renderLevelChart();
    filterChanged();
    search.focus();
  });
  for (const button of sortButtons) {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      state.direction = state.sort === key
        ? (state.direction === "ascending" ? "descending" : "ascending")
        : (key === "level" ? "descending" : "ascending");
      state.sort = key;
      filterChanged();
    });
  }
  for (const [id, step] of [["prev-page", -1], ["next-page", 1]]) {
    byId(id).addEventListener("click", () => {
      state.page += step;
      renderCatalog();
    });
  }
  rows.addEventListener("click", (event) => {
    const row = event.target.closest("[data-software]");
    if (row && !event.target.closest("a") && !window.getSelection()?.toString()) {
      window.location.hash = row.dataset.software;
    }
  });
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    byId("main").focus();
  });
  window.addEventListener("hashchange", showPage);

  renderProgress();
  renderLevelChart();
  renderCatalog();
  showPage();
})();
