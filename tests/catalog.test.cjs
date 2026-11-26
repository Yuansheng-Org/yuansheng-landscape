const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function catalog(reports) {
  const window = { LandscapeReports: reports };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../catalog.js"), "utf8"), { window });
  return window.SoftwareCatalog;
}

test("the empty catalogue has 59 entries and no test results", () => {
  const software = catalog([]);
  assert.equal(software.length, 59);
  assert.ok(software.every((s) => !s.current && !s.stage.assessed && s.level === null));
});

test("keep each report, honour confirmed L0 and admit previously unlisted software", () => {
  const meta = { software_id: "new-package", name: "New Package", platforms: { riscv64: "board" } };
  const confirmed = { ...meta, id: "a", date: "2026-01-01",
    assessment: { id: 8, revision: 3, confirmed: true, level: "L0" } };
  const draft = { ...meta, id: "b", date: "2026-02-01",
    assessment: { id: 8, revision: 4, confirmed: false, level: "L4" } };
  const run = { ...meta, id: "c", date: "2026-02-03", assessment: null };
  const software = catalog([draft, confirmed, run]);
  assert.equal(software.length, 60);
  const pkg = software.find((s) => s.id === "new-package");
  assert.equal(pkg.layer, "其他软件");
  assert.equal(pkg.reports.length, 3);
  assert.equal(pkg.current, confirmed);
  assert.equal(pkg.level, 0);
  assert.equal(pkg.stage.assessed, true);
  const pending = catalog([draft, run]).find((s) => s.id === "new-package");
  assert.equal(pending.current, run);
  assert.equal(pending.stage.assessed, false);
});
