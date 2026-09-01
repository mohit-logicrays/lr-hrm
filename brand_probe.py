#!/usr/bin/env python3
"""
brand_probe.py — run the enrichment extractors against ONE brand and print the
candidate table, without Django, without a database, without writing anything.

This is the tool you use to answer "what would the pipeline actually find for
AbsoluteXtracts?" before you let it near production.

    pip install requests beautifulsoup4

    # live crawl, discovery skipped because you know the domain
    python brand_probe.py --name "AbsoluteXtracts" --url https://absoluteextracts.com/

    # live crawl with discovery (needs a search key, see --help)
    BRAVE_SEARCH_KEY=xxx python brand_probe.py --name "AbsoluteXtracts"

    # fully offline: extract from a page you already saved
    python brand_probe.py --name "AbsoluteXtracts" --html-file abx.html \
                          --source-url https://absoluteextracts.com/

    # machine-readable, for piping into the real pipeline as a fixture
    python brand_probe.py --name "AbsoluteXtracts" --url https://… --json out.json

Exit code is 0 if any field auto-applies, 2 if everything landed in review.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from brand_enrichment import extract, geo  # noqa: E402

# Tables duplicated from brand_enrichment/models.py so this script stays
# Django-free. Keep them in sync — the probe is worthless if it disagrees
# with the pipeline it is meant to predict.
SOURCE_TRUST = {
    "manual": 1.00, "state_license": 0.95, "feed": 0.90, "jsonld": 0.85,
    "geocoder": 0.85, "opengraph": 0.70, "html": 0.60, "aggregator": 0.55,
    "llm": 0.50,
}
AUTO_APPLY_THRESHOLD = {
    "logo": 0.75, "description": 0.80, "website": 0.80, "phone_number": 0.80,
    "facebook": 0.55, "twitter": 0.55, "instagram": 0.55, "linkedin": 0.55,
    "youtube": 0.55, "rumble": 0.55,
    "address": 0.85, "address2": 0.85, "latitude": 0.85, "longitude": 0.85,
    "country": 0.85,
    "city_id": 0.90, "county_id": 0.90, "state_id": 0.90, "zip_code_id": 0.90,
    "brand_type_id": 0.90, "parent_brand_id": 0.95,
}
DEFAULT_THRESHOLD = 0.90
AGREEMENT_BONUS = 0.08


def same(a, b) -> bool:
    if isinstance(a, float) and isinstance(b, float):
        return abs(a - b) < 1e-4
    return str(a).strip().lower().rstrip("/") == str(b).strip().lower().rstrip("/")


def merge(signals):
    grouped = defaultdict(list)
    for s in signals:
        grouped[s.field_name].append(s)

    out = {}
    for fname, group in grouped.items():
        scored = sorted(
            ((SOURCE_TRUST.get(s.source, 0.5) * max(0.0, min(1.0, s.strength)), s)
             for s in group),
            key=lambda t: t[0], reverse=True,
        )
        conf, best = scored[0]
        agreeing = {s.source for c, s in scored[1:]
                    if same(s.value, best.value) and s.source != best.source}
        out[fname] = {
            "value": best.value,
            "confidence": round(min(1.0, conf + AGREEMENT_BONUS * len(agreeing)), 4),
            "source": best.source,
            "source_url": best.source_url,
            "agreement": sorted(agreeing),
            "all_sources": sorted({s.source for s in group}),
        }
    return out


def brave_search(query):
    import requests
    key = os.environ.get("BRAVE_SEARCH_KEY")
    if not key:
        print("  ! BRAVE_SEARCH_KEY unset — cannot run discovery. Pass --url instead.",
              file=sys.stderr)
        return []
    try:
        r = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"X-Subscription-Token": key, "Accept": "application/json"},
            params={"q": query, "count": 10, "country": "us"}, timeout=20,
        )
        r.raise_for_status()
        return [{"url": w.get("url"), "title": w.get("title"),
                 "snippet": w.get("description")}
                for w in r.json().get("web", {}).get("results", [])]
    except Exception as exc:                                    # noqa: BLE001
        print(f"  ! search failed: {exc}", file=sys.stderr)
        return []


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", required=True, help="brand name, e.g. AbsoluteXtracts")
    ap.add_argument("--url", help="root URL; skips discovery")
    ap.add_argument("--html-file", help="offline: extract from a saved page")
    ap.add_argument("--source-url", default="https://example.com/",
                    help="URL to attribute --html-file to")
    ap.add_argument("--pages", type=int, default=4, help="max pages to fetch")
    ap.add_argument("--no-geocode", action="store_true")
    ap.add_argument("--json", metavar="PATH", help="write full result as JSON")
    a = ap.parse_args()

    print(f"\n=== {a.name} ===")
    signals = []

    if a.html_file:
        html = open(a.html_file, encoding="utf-8", errors="replace").read()
        print(f"offline: {a.html_file} ({len(html):,} bytes) as {a.source_url}")
        signals += extract.extract_page(a.source_url, html, brand_name=a.name)
    else:
        root = a.url
        if not root:
            print("discovery…")
            root, conf = extract.discover_official_site(a.name, brave_search)
            if not root:
                print("  no candidate site found. Pass --url explicitly.")
                return 2
            print(f"  -> {root}  (confidence {conf:.2f})")
            signals.append(extract.Signal("website", root, "html", root, conf))
        else:
            print(f"root: {root} (discovery skipped)")

        print(f"crawling up to {a.pages} pages, robots-respecting, ~1.5s/host…")
        page_sigs = extract.crawl_brand_site(root, max_pages=a.pages, brand_name=a.name)
        if not page_sigs:
            print("  ! nothing extracted — site unreachable, JS-rendered, "
                  "robots-disallowed, or age-gated. See notes below.")
        for u in sorted({s.source_url for s in page_sigs if s.source_url}):
            print(f"  fetched {u}")
        signals += page_sigs

    if not signals:
        print("\nNo signals. Nothing to report.")
        return 2

    m = merge(signals)

    # geocode whatever address parts came back
    if not a.no_geocode:
        flat = {k: v["value"] for k, v in m.items()}
        one_line = geo.build_one_line(flat)
        if one_line:
            print(f"\ngeocoding: {one_line}")
            g = geo.geocode(one_line)
            if g:
                print(f"  matched: {g['matched_address']}")
                print(f"  lat/lng: {g['lat']}, {g['lng']}   "
                      f"state FIPS {g['state_fips']}  county GEOID {g['county_fips']}")
                signals += [
                    extract.Signal("address", g["matched_address"].split(",")[0].strip(),
                                   "geocoder", None, 0.98),
                    extract.Signal("latitude", g["lat"], "geocoder", None, 1.0),
                    extract.Signal("longitude", g["lng"], "geocoder", None, 1.0),
                ]
                m = merge(signals)
            else:
                print("  no match — address stays uncorroborated (review)")
        else:
            print("\nno complete address found; skipping geocode")

    # ---- report ----
    print(f"\n{'field':18}{'conf':>7}{'bar':>7}  {'verdict':<11}{'sources':<22}value")
    print("-" * 104)
    auto = review = 0
    for f in sorted(m):
        if f.startswith("_"):
            continue
        c = m[f]["confidence"]
        t = AUTO_APPLY_THRESHOLD.get(f, DEFAULT_THRESHOLD)
        ok = c >= t
        auto += ok
        review += not ok
        srcs = "+".join(m[f]["all_sources"])
        print(f"{f:18}{c:7.3f}{t:7.2f}  {'AUTO-APPLY' if ok else 'review':<11}"
              f"{srcs:<22}{str(m[f]['value'])[:40]}")

    internal = {k: v["value"] for k, v in m.items() if k.startswith("_")}
    if internal:
        print(f"\ninternal (feed the geocoder, never stored): {internal}")

    print(f"\n{auto} auto-apply, {review} to review")
    print("\nNOTE: every value above is only as good as its source_url. Open the "
          "URLs and eyeball them before trusting a backfill.")

    if a.json:
        with open(a.json, "w") as fh:
            json.dump({"brand": a.name, "fields": m}, fh, indent=2, default=str)
        print(f"wrote {a.json}")

    return 0 if auto else 2


if __name__ == "__main__":
    sys.exit(main())
