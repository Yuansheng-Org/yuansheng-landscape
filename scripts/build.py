"""Validate submitted Bench results and build the static Landscape site."""

import argparse
import hashlib
import json
import shutil
import sys
from datetime import date
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ("index.html", "styles.css", "detail.css", "app.js", "catalog.js", "data.js",
          "detail.js", "report.js", "logos.js", "chip.js", "performance-samples.js", "yuansheng-logo.png")


def object_pairs(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError(f"duplicate key: {key}")
        obj[key] = value
    return obj


def load_reports(folder):
    schema = json.loads((ROOT / "docs/result-v1.schema.json").read_text())
    validator = Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)
    reports = {}
    for path in sorted(folder.rglob("*")):
        if path.suffix.lower() != ".json":
            continue
        try:
            if path.is_symlink() or not path.is_file():
                raise ValueError("expected a regular JSON file")
            doc = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=object_pairs)
            error = next(validator.iter_errors(doc), None)
            if error:
                raise ValueError(f"{error.json_path}: {error.message}")
            date.fromisoformat(doc["tested_on"])
            body = {key: value for key, value in doc.items() if key != "result_id"}
            canonical = json.dumps(body, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            rid = hashlib.sha256(canonical.encode()).hexdigest()
            if rid != doc["result_id"]:
                raise ValueError("result_id does not match the exported content")
            if rid in reports:
                raise ValueError("duplicate result_id")
            if doc["assessment"] is None:
                runs = doc["runs"]
                if len({r["arch"] for r in runs}) != len(runs) or len({r["id"] for r in runs}) != len(runs):
                    raise ValueError("duplicate Run or architecture")
                if any(r["status"] is None for r in runs):
                    raise ValueError("a standalone Run must have a terminal status")
            reports[rid] = doc
        except (ValueError, OSError) as exc:
            raise ValueError(f"{path}: {exc}") from exc
    return list(reports.values())


def build(reports, output):
    # Use a fresh output directory. Do not leave deleted submissions in a subsequent deployment.
    if output.exists() and any(output.iterdir()):
        raise ValueError(f"choose an empty output directory: {output}")
    output.mkdir(exist_ok=True, parents=True)
    for asset in ASSETS:
        shutil.copyfile(ROOT / asset, output / asset)
    shutil.copytree(ROOT / "logos", output / "logos")
    (output / "results").mkdir()
    index = []
    for doc in reports:
        (output / "results" / (doc["result_id"] + ".json")).write_text(
            json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        assessment = doc["assessment"]
        index.append({
            "id": doc["result_id"], "software_id": doc["software_id"], "name": doc["software_name"],
            "date": doc["tested_on"],
            "assessment": {k: assessment[k] for k in ("id", "revision", "confirmed", "level", "version")}
            if assessment else None,
            "platforms": {r["arch"]: r["platform"] or r["arch"] for r in doc["runs"]},
        })
        if assessment:
            index[-1]["platforms"]["riscv64"] = assessment["target"]
            if assessment["reference"]:
                index[-1]["platforms"]["arm64"] = assessment["reference"]
    (output / "published-results.js").write_text(
        "window.LandscapeReports = " + json.dumps(index, ensure_ascii=True, separators=(",", ":")) + ";\n",
        encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results", type=Path, default=ROOT / "results")
    parser.add_argument("--output", type=Path, help="build to a new or empty directory")
    args = parser.parse_args()
    try:
        if not args.results.is_dir():
            raise ValueError(f"results directory does not exist: {args.results}")
        records = load_reports(args.results)
        if args.output:
            build(records, args.output)
        print(f"Validated {len(records)} Landscape result(s).")
    except (ValueError, OSError) as exc:
        sys.exit(str(exc))
