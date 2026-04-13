"""
Demo 01 — Authentication flow.

Shows:
  - Landing page
  - Register page (fills form, submits)
  - Login page (fills form, submits)
  - Dashboard redirect after login

Output: demos/output/01_auth/
"""

from __future__ import annotations

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

import helpers as h

OUT = h.OUTPUT_DIR / "01_auth"
TOTAL_STEPS = 5


def run(headless: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n=== Demo 01: Auth Flow ===")
    h.register_test_user()  # ensure user exists for the login half

    with sync_playwright() as pw:
        ctx = h.create_context(pw, OUT, headless=headless)
        page = ctx.new_page()

        # ── Title slide ───────────────────────────────────────────────────────
        h.show_title_slide(
            page,
            "Authentication",
            "Register a new account and log in to PrepMate",
            screenshot_path=OUT / "screenshots" / "00_title.png",
        )

        # ── Step 1: Landing page ──────────────────────────────────────────────
        h.show_step_slide(page, 1, TOTAL_STEPS, "Landing Page", "PrepMate's public entry point",
                          screenshot_path=OUT / "screenshots" / "01_step.png")

        page.goto(h.FRONTEND_BASE)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        h.snap(page, OUT, "01_landing")

        # ── Step 2: Register page ─────────────────────────────────────────────
        h.show_step_slide(page, 2, TOTAL_STEPS, "Register", "Create a new PrepMate account",
                          screenshot_path=OUT / "screenshots" / "02_step.png")

        page.goto(f"{h.FRONTEND_BASE}/register")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        h.snap(page, OUT, "02_register_empty")

        # Fill form
        page.get_by_placeholder("First name").fill(h.TEST_FIRSTNAME)
        page.get_by_placeholder("Last name").fill(h.TEST_LASTNAME)
        page.get_by_placeholder("Email").fill(f"newuser_{int(__import__('time').time())}@prepmate.dev")
        page.locator('input[type="password"]').first.fill(h.TEST_PASSWORD)
        page.wait_for_timeout(600)
        h.snap(page, OUT, "02_register_filled")

        # ── Step 3: Login page ────────────────────────────────────────────────
        h.show_step_slide(page, 3, TOTAL_STEPS, "Login", "Sign in with email and password",
                          screenshot_path=OUT / "screenshots" / "03_step.png")

        page.goto(f"{h.FRONTEND_BASE}/login")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)
        h.snap(page, OUT, "03_login_empty")

        # Fill credentials
        page.get_by_placeholder("Email").fill(h.TEST_EMAIL)
        page.locator('input[type="password"]').first.fill(h.TEST_PASSWORD)
        page.wait_for_timeout(500)
        h.snap(page, OUT, "03_login_filled")

        # Submit (exact=True avoids matching the Google "Sign in with Google" button)
        page.get_by_role("button", name="Sign in", exact=True).click()

        # ── Step 4: Dashboard redirect ────────────────────────────────────────
        h.show_step_slide(page, 4, TOTAL_STEPS, "Dashboard", "Successful login redirects to the dashboard",
                          screenshot_path=OUT / "screenshots" / "04_step.png")

        page.wait_for_url("**/dashboard", timeout=15_000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        h.snap(page, OUT, "04_dashboard")

        # ── Step 5: Summary ───────────────────────────────────────────────────
        h.show_summary_slide(
            page,
            "Auth Flow — Complete",
            [
                ("Landing page",     "OK", True),
                ("Register page",    "OK", True),
                ("Login page",       "OK", True),
                ("Dashboard access", "OK", True),
            ],
            screenshot_path=OUT / "screenshots" / "05_summary.png",
        )

        ctx.close()

    print(f"  Output → {OUT}")


if __name__ == "__main__":
    run(headless="--headed" not in sys.argv)
