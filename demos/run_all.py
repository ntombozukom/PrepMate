"""
run_all.py — Run all PrepMate demos in sequence.

Usage:
    python run_all.py              # headless (default)
    python run_all.py --headed     # show the browser window

Each demo saves to:
    demos/output/
      01_auth/               screenshots/ + video/
      02_prep_session/       screenshots/ + video/
      03_cv_tools_ats/       screenshots/ + video/
      04_cover_letter/       screenshots/ + video/
      05_profile/            screenshots/ + video/

Requirements:
    pip install playwright requests
    playwright install chromium

Notes:
    - Make sure PrepMate API is running at http://localhost:5000
    - Make sure PrepMate frontend is running at http://localhost:3001
    - The AI calls (match analysis, session generation, ATS, cover letter) hit
      the real Claude API — they will consume tokens and take 15–30s each.
    - To run a single demo: python demo_02_prep_session.py --headed
"""

from __future__ import annotations

import argparse
import sys
import time
import traceback
from pathlib import Path

# Ensure the demos directory is on sys.path so sibling modules resolve
sys.path.insert(0, str(Path(__file__).resolve().parent))

import helpers as h

# Import all demos
import demo_01_auth
import demo_02_prep_session
import demo_03_cv_tools_ats
import demo_04_cover_letter
import demo_05_profile

DEMOS = [
    ("01 — Auth Flow",            demo_01_auth.run),
    ("02 — Prep Session",         demo_02_prep_session.run),
    ("03 — ATS Optimizer",        demo_03_cv_tools_ats.run),
    ("04 — Cover Letter",         demo_04_cover_letter.run),
    ("05 — Profile Settings",     demo_05_profile.run),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run PrepMate demos")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    parser.add_argument(
        "--only",
        metavar="N",
        type=int,
        nargs="+",
        help="Run only these demo numbers (e.g. --only 2 3)",
    )
    args = parser.parse_args()

    headless = not args.headed

    print("\n" + "=" * 60)
    print(" PrepMate Demo Runner")
    print("=" * 60)
    print(f" Mode:   {'headed' if args.headed else 'headless'}")
    print(f" Output: {h.OUTPUT_DIR}")
    print(f" API:    {h.API_BASE}")
    print(f" App:    {h.FRONTEND_BASE}")
    print("=" * 60)

    # Ensure output root exists
    h.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Wait for both services before starting any demo
    print("\n Checking services...")
    h.wait_for_services(timeout=60)

    results: list[tuple[str, str]] = []

    for i, (name, fn) in enumerate(DEMOS, start=1):
        if args.only and i not in args.only:
            print(f"\n[SKIP] {name}")
            continue

        print(f"\n{'-' * 60}")
        print(f" Running: {name}")
        print(f"{'-' * 60}")

        t0 = time.monotonic()
        try:
            fn(headless=headless)
            elapsed = time.monotonic() - t0
            results.append((name, f"OK  ({elapsed:.0f}s)"))
        except Exception as exc:
            elapsed = time.monotonic() - t0
            print(f"\n  [ERROR] {exc}")
            traceback.print_exc()
            results.append((name, f"FAIL ({elapsed:.0f}s)"))

    # Final summary
    print("\n" + "=" * 60)
    print(" Results")
    print("=" * 60)
    for name, status in results:
        icon = "OK" if status.startswith("OK") else "!!"
        print(f"  {icon}  {name:<35} {status}")

    print(f"\n  All output saved under: {h.OUTPUT_DIR}\n")

    any_failed = any(s.startswith("FAIL") for _, s in results)
    sys.exit(1 if any_failed else 0)


if __name__ == "__main__":
    main()
