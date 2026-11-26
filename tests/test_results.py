"""Regression checks for immutable submissions, the generated index and null ratings."""

import hashlib
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from scripts.build import build, load_reports


def write_report(path, **fields):
    doc = {
        "schema_version": 1, "software_id": "openblas", "software_name": "OpenBLAS",
        "tested_on": "2026-01-02", "assessment": None,
        "runs": [{"id": 1, "generation": 0, "created_at": "2026-01-02T05:00:00Z", "status": "succeeded", "arch": "riscv64",
                  "platform": None, "recipe": "14-openblas", "commit": None, "patch_sha256": None,
                  "functional": {}, "measurements": [{"case": "dot", "metric": "duration_time",
                       "unit": "ms", "variant": "baseline", "mean": 0, "samples": 1}]}],
        **fields,
    }
    canonical = json.dumps(doc, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    doc["result_id"] = hashlib.sha256(canonical.encode()).hexdigest()
    path.write_text(json.dumps(doc), encoding="utf-8")
    return doc


class ResultsTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.folder = self.root / "results"
        self.folder.mkdir()
        self.path = self.folder / "upload.json"

    def test_build_roundtrip(self):
        doc = write_report(self.path)
        records = load_reports(self.folder)
        out = self.root / "site"
        build(records, out)
        self.assertEqual(doc, json.loads((out / "results" / (doc["result_id"] + ".json")).read_text()))
        index = (out / "published-results.js").read_text()
        self.assertIn(doc["result_id"], index)
        self.assertNotIn("measurements", index)
        self.assertIn("report.js", (out / "index.html").read_text())

    def test_repeated_and_tampered(self):
        doc = write_report(self.path)
        other = self.folder / "same.JSON"
        other.write_bytes(self.path.read_bytes())
        with self.assertRaisesRegex(ValueError, "duplicate result_id"):
            load_reports(self.folder)
        other.unlink()
        doc["runs"][0]["measurements"][0]["mean"] = 45
        self.path.write_text(json.dumps(doc))
        with self.assertRaisesRegex(ValueError, "does not match"):
            load_reports(self.folder)

    def test_bad_schema_and_pairing(self):
        record = write_report(self.path)
        run = record["runs"][0]
        for fields in ({"schema_version": 2}, {"runs": []}, {"tested_on": "2026-02-30"},
                       {"runs": [run, deepcopy(run)]}, {"private_config": "unexpected"}):
            with self.subTest(fields=fields):
                write_report(self.path, **fields)
                with self.assertRaises(ValueError):
                    load_reports(self.folder)
