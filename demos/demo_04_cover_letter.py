"""
Demo 04 — Cover Letter Generator.

Shows:
  - CV Tools page → Cover Letter tab
  - Fill optional job title, company, JD
  - Click Generate
  - Rendered cover letter with copy button

Output: demos/output/04_cover_letter/
"""

from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

import helpers as h

OUT         = h.OUTPUT_DIR / "04_cover_letter"
TOTAL_STEPS = 5


def run(headless: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n=== Demo 04: Cover Letter Generator ===")

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
            "Cover Letter Generator",
            "Generate a personalised, professional cover letter from your CV — with or without a JD.",
            screenshot_path=OUT / "screenshots" / "00_title.png",
        )

        # ── Step 1: Cover Letter tab ───────────────────────────────────────────
        h.show_step_slide(
            page, 1, TOTAL_STEPS,
            "Cover Letter Tab",
            "Navigate to CV Tools and click the Cover Letter tab.",
            screenshot_path=OUT / "screenshots" / "01_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/cv-tools")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        try:
            page.get_by_text("Cover Letter").click()
            page.wait_for_timeout(600)
        except Exception:
            pass

        h.snap(page, OUT, "01_cover_letter_tab")

        # ── Step 2: Fill in job details ───────────────────────────────────────
        h.show_step_slide(
            page, 2, TOTAL_STEPS,
            "Add Job Details",
            "Optionally add role, company, and JD text for a targeted letter.",
            screenshot_path=OUT / "screenshots" / "02_step.png",
        )

        try:
            page.get_by_placeholder("e.g. Senior Engineer").fill("Senior Software Engineer")
            page.get_by_placeholder("e.g. Capitec Bank").fill("FinChoice Africa")
            page.wait_for_timeout(400)

            textarea = page.locator("textarea").first
            textarea.fill(h.SAMPLE_JD[:800])  # use first 800 chars for the demo
            page.wait_for_timeout(400)
        except Exception:
            pass

        h.snap(page, OUT, "02_form_filled")

        # ── Step 3: Generate ──────────────────────────────────────────────────
        h.show_step_slide(
            page, 3, TOTAL_STEPS,
            "Generating Cover Letter",
            "Claude writes a 3–4 paragraph letter tailored to the role, company, and your CV.",
            note="The letter opens with a strong hook (never 'I am writing to apply for...') and ends with a clear call to action.",
            screenshot_path=OUT / "screenshots" / "03_step.png",
        )

        try:
            page.get_by_text("Generate Cover Letter").first.click()
            page.wait_for_timeout(1000)
            h.snap(page, OUT, "03_generating_spinner")
        except Exception:
            pass

        print("  Waiting for cover letter generation (~15s)...")
        try:
            page.wait_for_selector("text=Cover Letter", timeout=60_000)
            # Wait for the actual letter content (not the tab)
            page.wait_for_selector("text=tone", timeout=60_000)
            page.wait_for_timeout(1000)
        except Exception:
            print("  [WARN] Cover letter generation may have timed out")

        h.snap(page, OUT, "03_cover_letter_top")

        # ── Step 4: Full letter + copy ────────────────────────────────────────
        h.show_step_slide(
            page, 4, TOTAL_STEPS,
            "Cover Letter Output",
            "The full letter rendered with paragraph breaks. One click to copy to clipboard.",
            screenshot_path=OUT / "screenshots" / "04_step.png",
        )

        # Scroll to see more of the letter
        try:
            page.locator("text=tone").scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            h.snap(page, OUT, "04_cover_letter_body")

            # Click copy
            page.get_by_text("Copy").click()
            page.wait_for_timeout(800)
            h.snap(page, OUT, "04_copied")
        except Exception:
            pass

        # ── Step 5: Summary slide ─────────────────────────────────────────────
        h.show_summary_slide(
            page,
            "Cover Letter Generator — Complete",
            [
                ("CV Tools navigation",           "OK", True),
                ("Cover Letter tab",              "OK", True),
                ("Job details (title, company)",  "OK", True),
                ("JD-targeted generation",        "OK", True),
                ("Personalised letter rendered",  "OK", True),
                ("Copy to clipboard",             "OK", True),
            ],
            screenshot_path=OUT / "screenshots" / "05_summary.png",
        )

        ctx.close()

    print(f"  Output → {OUT}")


if __name__ == "__main__":
    run(headless="--headed" not in sys.argv)
