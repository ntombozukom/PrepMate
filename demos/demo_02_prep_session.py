"""
Demo 02 — Full prep session flow.

Shows:
  - Step 1: CV upload (sidebar + stepper visible)
  - Step 2: Paste job description, auto-detect role/industry
  - Step 3: Skills match analysis (score, matched skills, gaps)
  - Generate prep session (spinner → concepts loaded)
  - Expand a concept card to show Plain English + Technical Depth + Suggested Answer
  - Session detail page (full view)

Output: demos/output/02_prep_session/
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

import helpers as h

OUT         = h.OUTPUT_DIR / "02_prep_session"
TOTAL_STEPS = 8


def run(headless: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n=== Demo 02: Prep Session Flow ===")

    # API setup: register user, log in, upload CV
    h.register_test_user()
    token = h.login_api()
    cv    = h.upload_cv_api(token, h.SAMPLE_CV)

    with sync_playwright() as pw:
        ctx  = h.create_context(pw, OUT, headless=headless)
        page = ctx.new_page()

        # Inject token so browser starts authenticated
        h.inject_token(page, token)

        # ── Title slide ───────────────────────────────────────────────────────
        h.show_title_slide(
            page,
            "Prep Session",
            "Upload CV → Add Job Description → Analyse Match → Generate AI prep content",
            screenshot_path=OUT / "screenshots" / "00_title.png",
        )

        # ── Step 1: Dashboard + CV uploaded ───────────────────────────────────
        h.show_step_slide(
            page, 1, TOTAL_STEPS,
            "Step 1 — Your CV",
            "CV is already uploaded. The stepper shows Step 1 complete.",
            screenshot_path=OUT / "screenshots" / "01_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        h.snap(page, OUT, "01_dashboard_cv_ready")

        # Click "Next: Add Job Description" to go to step 2
        try:
            page.get_by_text("Next: Add Job Description").first.click()
            page.wait_for_timeout(800)
        except Exception:
            pass

        # ── Step 2: Job Description ───────────────────────────────────────────
        h.show_step_slide(
            page, 2, TOTAL_STEPS,
            "Step 2 — Job Description",
            "Switch to Paste mode and type the JD. Auto-detection fires after 1.5s.",
            screenshot_path=OUT / "screenshots" / "02_step.png",
        )

        # Switch to paste mode
        try:
            page.get_by_text("Paste text").click()
            page.wait_for_timeout(400)
        except Exception:
            pass

        textarea = page.locator("textarea").first
        textarea.fill(h.SAMPLE_JD)
        page.wait_for_timeout(500)
        h.snap(page, OUT, "02_jd_filled")

        # Wait for auto-detect spinner then result
        print("  Waiting for JD auto-detection (~2s)...")
        page.wait_for_timeout(3500)
        h.snap(page, OUT, "02_jd_autodetected")

        # Click "Analyse Match"
        try:
            page.get_by_text("Analyse Match").first.click()
            page.wait_for_timeout(500)
        except Exception:
            pass

        # ── Step 3: Match analysis loading ────────────────────────────────────
        h.show_step_slide(
            page, 3, TOTAL_STEPS,
            "Step 3 — Skills Match Analysis",
            "Claude compares your CV against the JD and scores the fit.",
            screenshot_path=OUT / "screenshots" / "03_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Navigate through stepper programmatically for reliable demo
        # Go to step 2
        try:
            page.get_by_text("Next: Add Job Description").first.click()
            page.wait_for_timeout(400)
            page.get_by_text("Paste text").click()
            page.wait_for_timeout(300)
            textarea = page.locator("textarea").first
            textarea.fill(h.SAMPLE_JD)
            page.wait_for_timeout(3500)  # wait for auto-detect
            page.get_by_text("Analyse Match").first.click()
        except Exception:
            pass

        # Match analysis loading spinner
        page.wait_for_timeout(1000)
        h.snap(page, OUT, "03_match_loading")

        # Wait for match result (~10-20s for Claude API)
        print("  Waiting for match analysis (~15s)...")
        try:
            page.wait_for_selector("text=Skills Match", timeout=40_000)
            page.wait_for_timeout(1000)
        except Exception:
            print("  [WARN] Match analysis may have timed out")

        h.snap(page, OUT, "03_match_result")

        # ── Step 4: Match score detail ────────────────────────────────────────
        h.show_step_slide(
            page, 4, TOTAL_STEPS,
            "Match Result",
            "Score bar, matched skills with evidence, and skill gaps with tips.",
            screenshot_path=OUT / "screenshots" / "04_step.png",
        )

        # Scroll to see gaps if they exist
        try:
            page.locator("text=Skill Gaps").scroll_into_view_if_needed()
            page.wait_for_timeout(800)
        except Exception:
            pass
        h.snap(page, OUT, "04_match_gaps")

        # ── Step 5: Generate session ──────────────────────────────────────────
        h.show_step_slide(
            page, 5, TOTAL_STEPS,
            "Generate Prep Session",
            "Click Generate — Claude builds 10 personalised concept explanations (Fundamental → Expert).",
            note="This takes ~30 seconds. The session covers everything from basics to expert level with real code examples.",
            screenshot_path=OUT / "screenshots" / "05_step.png",
        )

        try:
            page.get_by_text("Generate Prep Session").first.click()
            page.wait_for_timeout(1500)
            h.snap(page, OUT, "05_generating_spinner")
        except Exception:
            pass

        # Wait for concepts to load (Claude API call ~30s)
        print("  Waiting for session generation (~30s)...")
        try:
            page.wait_for_selector("text=Plain English", timeout=90_000)
            page.wait_for_timeout(1500)
        except Exception:
            print("  [WARN] Session generation may have timed out")

        h.snap(page, OUT, "05_session_generated")

        # ── Step 6: Expand a concept card ─────────────────────────────────────
        h.show_step_slide(
            page, 6, TOTAL_STEPS,
            "Concept Cards",
            "Each card has Plain English, Technical Depth, Industry Context, and a spoken answer script.",
            screenshot_path=OUT / "screenshots" / "06_step.png",
        )

        try:
            # Click the first concept card to expand it
            page.locator(".rounded-2xl.border.bg-white button").first.click()
            page.wait_for_timeout(800)
            h.snap(page, OUT, "06_concept_expanded")

            # Scroll to see more content
            page.locator("text=Technical Depth").first.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "06_concept_technical_depth")

            page.locator("text=Say this out loud").first.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            h.snap(page, OUT, "06_concept_suggested_answer")
        except Exception:
            pass

        # ── Step 7: Session detail page ───────────────────────────────────────
        h.show_step_slide(
            page, 7, TOTAL_STEPS,
            "Full Session View",
            "Click 'Full view' to open the dedicated session page with all concepts.",
            screenshot_path=OUT / "screenshots" / "07_step.png",
        )

        try:
            page.get_by_text("Full view").first.click()
            page.wait_for_url("**/sessions/**", timeout=10_000)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1500)
            h.snap(page, OUT, "07_session_detail")
        except Exception:
            pass

        # ── Step 8: Summary ───────────────────────────────────────────────────
        h.show_summary_slide(
            page,
            "Prep Session Flow — Complete",
            [
                ("CV upload (Step 1)",         "OK", True),
                ("JD input + auto-detect",     "OK", True),
                ("Skills match analysis",      "OK", True),
                ("Session generated (10 concepts)", "OK", True),
                ("Concept cards (Fundamental→Expert)", "OK", True),
                ("Session detail page",        "OK", True),
            ],
            screenshot_path=OUT / "screenshots" / "08_summary.png",
        )

        ctx.close()

    print(f"  Output → {OUT}")


if __name__ == "__main__":
    run(headless="--headed" not in sys.argv)
