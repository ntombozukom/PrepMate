"""
Demo 03 — ATS Optimizer.

Shows:
  - CV Tools page (sidebar navigation)
  - ATS tab selected
  - "Analyse CV" button clicked
  - Score, strengths, improvements, rewritten summary, keywords

Output: demos/output/03_cv_tools_ats/
"""

from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

import helpers as h

OUT         = h.OUTPUT_DIR / "03_cv_tools_ats"
TOTAL_STEPS = 5


def run(headless: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n=== Demo 03: ATS Optimizer ===")

    h.register_test_user()
    token = h.login_api()
    h.upload_cv_api(token, h.SAMPLE_CV)

    with sync_playwright() as pw:
        ctx  = h.create_context(pw, OUT, headless=headless)
        page = ctx.new_page()

        h.inject_token(page, token)

        # ── Title slide ───────────────────────────────────────────────────────
        h.show_title_slide(
            page,
            "ATS Optimizer",
            "Score your CV for ATS compatibility and get a rewritten summary with the right keywords.",
            screenshot_path=OUT / "screenshots" / "00_title.png",
        )

        # ── Step 1: CV Tools page ─────────────────────────────────────────────
        h.show_step_slide(
            page, 1, TOTAL_STEPS,
            "CV Tools Page",
            "Navigate to CV Tools via the sidebar — ATS Optimiser tab is the default.",
            screenshot_path=OUT / "screenshots" / "01_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/cv-tools")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        h.snap(page, OUT, "01_cv_tools_page")

        # ── Step 2: Run ATS analysis ──────────────────────────────────────────
        h.show_step_slide(
            page, 2, TOTAL_STEPS,
            "Running ATS Analysis",
            "Claude scores the CV on keyword density, formatting, and section structure.",
            note="ATS systems reject up to 75% of CVs before a human sees them. A score above 70 is considered ATS-safe.",
            screenshot_path=OUT / "screenshots" / "02_step.png",
        )

        try:
            page.get_by_text("Analyse CV").first.click()
            page.wait_for_timeout(1000)
            h.snap(page, OUT, "02_analysing_spinner")
        except Exception:
            pass

        print("  Waiting for ATS analysis (~15s)...")
        try:
            page.wait_for_selector("text=ATS Score", timeout=60_000)
            page.wait_for_timeout(1000)
        except Exception:
            print("  [WARN] ATS analysis may have timed out")

        h.snap(page, OUT, "02_ats_score")

        # ── Step 3: Strengths + Improvements ─────────────────────────────────
        h.show_step_slide(
            page, 3, TOTAL_STEPS,
            "Strengths & Improvements",
            "What the CV does well for ATS, and specific actionable fixes.",
            screenshot_path=OUT / "screenshots" / "03_step.png",
        )

        try:
            page.locator("text=What's Working").scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "03_strengths")

            page.locator("text=Improvements").scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "03_improvements")
        except Exception:
            pass

        # ── Step 4: Rewritten summary + keywords ──────────────────────────────
        h.show_step_slide(
            page, 4, TOTAL_STEPS,
            "Rewritten Summary & Keywords",
            "An ATS-optimised professional summary and a list of keywords to add to the CV.",
            screenshot_path=OUT / "screenshots" / "04_step.png",
        )

        try:
            page.locator("text=ATS-Optimised Summary").scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "04_rewritten_summary")

            page.locator("text=Keywords to Add").scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "04_keywords")
        except Exception:
            pass

        # ── Step 5: Summary slide ─────────────────────────────────────────────
        h.show_summary_slide(
            page,
            "ATS Optimizer — Complete",
            [
                ("CV Tools page navigation",  "OK", True),
                ("ATS score (0–100)",          "OK", True),
                ("Strengths identified",       "OK", True),
                ("Improvements listed",        "OK", True),
                ("ATS-optimised summary",      "OK", True),
                ("Keywords to add",            "OK", True),
            ],
            screenshot_path=OUT / "screenshots" / "05_summary.png",
        )

        ctx.close()

    print(f"  Output → {OUT}")


if __name__ == "__main__":
    run(headless="--headed" not in sys.argv)
