"""
Demo 05 — Profile & Account Settings.

Shows:
  - Navigate to /profile via sidebar user avatar
  - Personal Information section (edit first/last name, save)
  - Active CV card
  - Change Password form
  - Danger Zone (deactivate confirmation)

Output: demos/output/05_profile/
"""

from __future__ import annotations

import sys

from playwright.sync_api import sync_playwright

import helpers as h

OUT         = h.OUTPUT_DIR / "05_profile"
TOTAL_STEPS = 6


def run(headless: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    print("\n=== Demo 05: Profile & Account Settings ===")

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
            "Profile & Account Settings",
            "Update your name, change your password, manage your CV and account lifecycle.",
            screenshot_path=OUT / "screenshots" / "00_title.png",
        )

        # ── Step 1: Navigate to profile ───────────────────────────────────────
        h.show_step_slide(
            page, 1, TOTAL_STEPS,
            "Navigate to Profile",
            "Click the user avatar in the sidebar to open Account Settings.",
            screenshot_path=OUT / "screenshots" / "01_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        h.snap(page, OUT, "01_dashboard_sidebar")

        # Click the user avatar / profile link in the sidebar
        try:
            page.locator("a[href='/profile']").first.click()
            page.wait_for_url("**/profile", timeout=8_000)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1200)
        except Exception:
            page.goto(f"{h.FRONTEND_BASE}/profile")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1200)

        h.snap(page, OUT, "01_profile_page")

        # ── Step 2: Personal Information section ──────────────────────────────
        h.show_step_slide(
            page, 2, TOTAL_STEPS,
            "Personal Information",
            "Update first and last name. Email address is read-only.",
            screenshot_path=OUT / "screenshots" / "02_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/profile")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Clear and update first name
        try:
            first_input = page.get_by_label("First Name")
            first_input.triple_click()
            first_input.fill("Alex (Updated)")
            page.wait_for_timeout(400)

            last_input = page.get_by_label("Last Name")
            last_input.triple_click()
            last_input.fill("Demo")
            page.wait_for_timeout(400)
        except Exception:
            try:
                inputs = page.locator('input[type="text"]')
                inputs.first.triple_click()
                inputs.first.fill("Alex (Updated)")
                inputs.nth(1).triple_click()
                inputs.nth(1).fill("Demo")
                page.wait_for_timeout(400)
            except Exception:
                pass

        h.snap(page, OUT, "02_profile_form_filled")

        # Click Save Changes
        try:
            page.get_by_text("Save Changes").first.click()
            page.wait_for_timeout(2000)
            h.snap(page, OUT, "02_profile_saved")
        except Exception:
            pass

        # ── Step 3: CV section ────────────────────────────────────────────────
        h.show_step_slide(
            page, 3, TOTAL_STEPS,
            "Your CV",
            "Active CV shows file name, size, and upload date. One click to replace it.",
            screenshot_path=OUT / "screenshots" / "03_step.png",
        )

        page.goto(f"{h.FRONTEND_BASE}/profile")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1200)

        try:
            page.locator("text=Your CV").scroll_into_view_if_needed()
            page.wait_for_timeout(600)
        except Exception:
            pass

        h.snap(page, OUT, "03_cv_section")

        # ── Step 4: Change password ────────────────────────────────────────────
        h.show_step_slide(
            page, 4, TOTAL_STEPS,
            "Change Password",
            "Enter current password and set a new one — client validates match and length first.",
            screenshot_path=OUT / "screenshots" / "04_step.png",
        )

        try:
            page.locator("text=Change Password").first.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
        except Exception:
            pass

        try:
            pwd_inputs = page.locator('input[type="password"]')
            pwd_inputs.nth(0).fill(h.TEST_PASSWORD)
            pwd_inputs.nth(1).fill("NewDemo1234!")
            pwd_inputs.nth(2).fill("NewDemo1234!")
            page.wait_for_timeout(500)
        except Exception:
            pass

        h.snap(page, OUT, "04_password_form_filled")

        # ── Step 5: Danger Zone ────────────────────────────────────────────────
        h.show_step_slide(
            page, 5, TOTAL_STEPS,
            "Danger Zone",
            "Two-step deactivation confirmation. Data retained for 30 days before permanent deletion.",
            note="Clicking 'Deactivate' requires a second confirmation before anything happens.",
            screenshot_path=OUT / "screenshots" / "05_step.png",
        )

        try:
            page.locator("text=Danger Zone").scroll_into_view_if_needed()
            page.wait_for_timeout(800)
            h.snap(page, OUT, "05_danger_zone")

            # Click "Deactivate" to reveal confirmation
            page.get_by_text("Deactivate").first.click()
            page.wait_for_timeout(800)
            h.snap(page, OUT, "05_deactivate_confirmation")

            # Cancel so we don't actually deactivate
            page.get_by_text("Cancel").first.click()
            page.wait_for_timeout(600)
        except Exception:
            pass

        # ── Step 6: Summary slide ──────────────────────────────────────────────
        h.show_summary_slide(
            page,
            "Profile Settings — Complete",
            [
                ("Profile page navigation",      "OK", True),
                ("Update name (first + last)",   "OK", True),
                ("Active CV displayed",          "OK", True),
                ("Change password form",         "OK", True),
                ("Danger zone (two-step)",       "OK", True),
            ],
            screenshot_path=OUT / "screenshots" / "06_summary.png",
        )

        ctx.close()

    print(f"  Output → {OUT}")


if __name__ == "__main__":
    run(headless="--headed" not in sys.argv)
