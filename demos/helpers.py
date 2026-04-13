"""
PrepMate demo helpers.

Shared utilities for slide rendering, browser setup, API calls,
and output directory management.
"""

from __future__ import annotations

import html
import json
import time
import requests
from pathlib import Path
from playwright.sync_api import Playwright, BrowserContext, Page

# ── Service URLs ──────────────────────────────────────────────────────────────
API_BASE      = "http://localhost:5050/api/v1"
FRONTEND_BASE = "http://localhost:3001"

# ── Viewport ──────────────────────────────────────────────────────────────────
VIEWPORT_W = 1280
VIEWPORT_H = 800

# ── Output root ───────────────────────────────────────────────────────────────
_BASE_DIR  = Path(__file__).resolve().parent
OUTPUT_DIR = _BASE_DIR / "output"

# ── Demo test data ────────────────────────────────────────────────────────────
TEST_EMAIL     = "demo@prepmate.dev"
TEST_PASSWORD  = "Demo1234!"
TEST_FIRSTNAME = "Alex"
TEST_LASTNAME  = "Demo"

SAMPLE_CV = """\
Alex Demo
Senior Software Engineer
alex.demo@email.com | Cape Town, South Africa | github.com/alexdemo

PROFESSIONAL SUMMARY
Experienced .NET and cloud engineer with 6+ years building fintech and banking systems.
Strong background in Clean Architecture, CQRS, microservices, and API design.

SKILLS
Languages:      C#, Python, TypeScript, SQL
Frameworks:     .NET 9, ASP.NET Core, Entity Framework Core, React
Cloud:          Azure (App Service, Functions, Service Bus), Docker
Architecture:   Clean Architecture, CQRS/MediatR, Domain-Driven Design, REST APIs
Databases:      PostgreSQL, SQL Server, Redis
Tools:          Git, GitHub Actions, Jira, Postman

EXPERIENCE
Senior Software Engineer — FinPayCo, Cape Town (2021–Present)
- Designed and built a real-time debit order processing system handling 50k+ transactions/day
- Led migration from monolith to microservices architecture (C#/.NET 6 → .NET 9)
- Implemented PCI-DSS compliant payment tokenisation layer using Azure Key Vault
- Reduced API response time by 40% through Redis caching and query optimisation

Software Engineer — BankTech Solutions (2018–2021)
- Built loan origination API used by 3 major South African banks (NCA compliant)
- Integrated with credit bureaus (TransUnion, Experian) via SOAP/REST adapters
- Developed automated reconciliation service reducing manual effort by 80%

EDUCATION
BSc Computer Science — University of Cape Town (2018)

CERTIFICATIONS
- Microsoft Azure Developer Associate (AZ-204)
- AWS Cloud Practitioner
"""

SAMPLE_JD = """\
Senior Software Engineer — FinChoice Africa

About the Role:
FinChoice Africa is looking for a Senior Software Engineer to join our core lending platform team.
You will design, build, and maintain high-throughput financial systems that power digital lending
for millions of South Africans.

Key Responsibilities:
- Design and implement scalable microservices using .NET / C#
- Build and maintain RESTful APIs for loan origination and collections systems
- Work with cloud infrastructure (Azure) to ensure high availability
- Implement CQRS and event-driven patterns for core financial workflows
- Ensure compliance with NCA (National Credit Act) and POPIA regulations
- Collaborate with product, QA, and data teams in an Agile environment

Requirements:
- 5+ years of C# / .NET experience
- Strong understanding of Clean Architecture, CQRS, and DDD
- Experience with PostgreSQL or SQL Server
- Azure cloud experience (App Service, Service Bus, Functions)
- Understanding of financial regulations (NCA, POPIA, FICA)
- Experience with microservices and containerisation (Docker/Kubernetes)
- Knowledge of Redis caching and message queues

Nice to have:
- Fintech or banking domain experience
- React/TypeScript for cross-functional collaboration
- Experience with EF Core and database migrations

Company: FinChoice Africa | Location: Hybrid, Cape Town
"""


# ── API helpers ───────────────────────────────────────────────────────────────

def wait_for_services(timeout: int = 60, interval: float = 2.0) -> None:
    """Poll API and frontend until both are up."""
    services = {
        "PrepMate API":      "http://localhost:5050/health",
        "PrepMate Frontend": FRONTEND_BASE,
    }
    deadline = time.time() + timeout
    pending  = dict(services)

    while pending and time.time() < deadline:
        for name, url in list(pending.items()):
            try:
                r = requests.get(url, timeout=5)
                if r.status_code < 500:
                    print(f"  [UP] {name}")
                    del pending[name]
            except requests.ConnectionError:
                pass
        if pending:
            print(f"  Waiting for: {', '.join(pending)} ...")
            time.sleep(interval)

    if pending:
        raise RuntimeError(f"Services not ready after {timeout}s: {', '.join(pending)}")


def register_test_user(retries: int = 5, retry_delay: float = 8.0) -> dict | None:
    """Register the demo user (ignores 400/409 if already exists). Retries on timeout/error."""
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(f"{API_BASE}/auth/register", json={
                "email":     TEST_EMAIL,
                "password":  TEST_PASSWORD,
                "firstName": TEST_FIRSTNAME,
                "lastName":  TEST_LASTNAME,
            }, timeout=20)
            if r.ok:
                print(f"  [OK] Registered demo user: {TEST_EMAIL}")
                return r.json()
            if r.status_code in (400, 409):
                print(f"  [OK] Demo user already exists: {TEST_EMAIL}")
                return None
            r.raise_for_status()
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            print(f"  [WARN] API not ready (attempt {attempt}/{retries}): {type(exc).__name__} -- waiting {retry_delay}s...")
            if attempt < retries:
                time.sleep(retry_delay)
    raise RuntimeError(f"Could not reach API at {API_BASE} after {retries} attempts")


def login_api(retries: int = 5, retry_delay: float = 8.0) -> str:
    """Log in via API and return the access token. Retries on timeout/error."""
    for attempt in range(1, retries + 1):
        try:
            r = requests.post(f"{API_BASE}/auth/login", json={
                "email":    TEST_EMAIL,
                "password": TEST_PASSWORD,
            }, timeout=20)
            r.raise_for_status()
            token = r.json()["accessToken"]
            print(f"  [OK] Logged in, token: {token[:20]}...")
            return token
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            print(f"  [WARN] API not ready (attempt {attempt}/{retries}): {type(exc).__name__} -- waiting {retry_delay}s...")
            if attempt < retries:
                time.sleep(retry_delay)
    raise RuntimeError(f"Could not reach API at {API_BASE} after {retries} attempts")


def upload_cv_api(token: str, cv_text: str) -> dict:
    """Upload a CV as a .txt file via the API and return the CV document."""
    files = {"file": ("demo_cv.txt", cv_text.encode(), "text/plain")}
    r = requests.post(
        f"{API_BASE}/cv/upload",
        files=files,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    r.raise_for_status()
    cv = r.json()
    print(f"  [OK] CV uploaded: {cv['id']}")
    return cv


# ── Browser context ───────────────────────────────────────────────────────────

def create_context(playwright: Playwright, out_dir: Path, headless: bool = True) -> BrowserContext:
    """Launch Chromium with video recording into *out_dir/video/*."""
    video_dir = out_dir / "video"
    video_dir.mkdir(parents=True, exist_ok=True)

    browser = playwright.chromium.launch(headless=headless)
    ctx = browser.new_context(
        viewport={"width": VIEWPORT_W, "height": VIEWPORT_H},
        record_video_dir=str(video_dir),
        record_video_size={"width": VIEWPORT_W, "height": VIEWPORT_H},
    )
    return ctx


def inject_token(page: Page, token: str) -> None:
    """Inject a JWT so the browser session starts authenticated."""
    page.goto(FRONTEND_BASE)
    page.wait_for_load_state("networkidle")
    page.evaluate(f"localStorage.setItem('access_token', '{token}')")
    page.reload()
    page.wait_for_load_state("networkidle")


# ── Slide helpers ─────────────────────────────────────────────────────────────

_INDIGO = "#4f46e5"
_BG     = "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)"


def show_title_slide(
    page: Page,
    title: str,
    subtitle: str = "",
    *,
    pause_ms: int = 2500,
    screenshot_path: Path | None = None,
) -> None:
    """Full-screen title card."""
    content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{{margin:0;padding:0;box-sizing:border-box}}</style></head>
<body style="background:{_BG};min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px;">
  <div style="width:56px;height:4px;background:{_INDIGO};border-radius:2px;margin-bottom:32px;"></div>
  <h1 style="color:#f8fafc;font-size:36px;font-weight:800;line-height:1.25;max-width:640px;">
    {html.escape(title)}</h1>
  {"<p style='color:#94a3b8;font-size:18px;margin-top:16px;max-width:520px;line-height:1.6;'>" + html.escape(subtitle) + "</p>" if subtitle else ""}
  <div style="width:56px;height:4px;background:{_INDIGO};border-radius:2px;margin-top:32px;"></div>
  <p style="color:#334155;font-size:12px;margin-top:48px;letter-spacing:0.05em;">PREPMATE &middot; AI INTERVIEW PREP</p>
</body></html>"""

    page.set_content(content)
    page.wait_for_timeout(pause_ms)
    if screenshot_path:
        page.screenshot(path=str(screenshot_path), full_page=False)


def show_step_slide(
    page: Page,
    step: int,
    total: int,
    title: str,
    subtitle: str = "",
    *,
    note: str = "",
    pause_ms: int = 2000,
    screenshot_path: Path | None = None,
) -> None:
    """Step-in-flow info slide with progress bar."""
    pct = int(step / total * 100)

    note_html = ""
    if note:
        note_html = f"""
        <div style="margin-top:20px;background:#1e1b4b;border:1px solid {_INDIGO}55;border-radius:10px;padding:14px 18px;">
          <p style="color:#a5b4fc;font-size:13px;line-height:1.65;">{html.escape(note)}</p>
        </div>"""

    content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{{margin:0;padding:0;box-sizing:border-box}}</style></head>
<body style="background:{_BG};min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:36px;display:flex;flex-direction:column;">
  <div style="margin-bottom:28px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
      <span style="color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Step {step} of {total}</span>
      <span style="color:#475569;font-size:11px;">{pct}%</span>
    </div>
    <div style="height:3px;background:#1e293b;border-radius:2px;">
      <div style="height:100%;width:{pct}%;background:{_INDIGO};border-radius:2px;"></div>
    </div>
  </div>

  <h1 style="color:#f8fafc;font-size:28px;font-weight:700;line-height:1.3;">{html.escape(title)}</h1>
  {"<p style='color:#94a3b8;font-size:15px;margin-top:10px;line-height:1.6;'>" + html.escape(subtitle) + "</p>" if subtitle else ""}
  {note_html}

  <div style="margin-top:auto;padding-top:20px;border-top:1px solid #1e293b;">
    <span style="color:#334155;font-size:11px;">PrepMate &middot; AI Interview Prep</span>
  </div>
</body></html>"""

    page.set_content(content)
    page.wait_for_timeout(pause_ms)
    if screenshot_path:
        page.screenshot(path=str(screenshot_path), full_page=False)


def show_summary_slide(
    page: Page,
    title: str,
    items: list[tuple[str, str, bool]],   # (label, value, passed)
    *,
    pause_ms: int = 3000,
    screenshot_path: Path | None = None,
) -> None:
    """Summary slide with a list of (label, value, passed) rows."""
    rows = ""
    for label, value, passed in items:
        icon  = "&#10003;" if passed else "&#10007;"
        color = "#22c55e"  if passed else "#ef4444"
        rows += f"""
        <div style="display:flex;justify-content:space-between;align-items:center;
                    padding:11px 0;border-bottom:1px solid #1e293b;">
          <span style="color:#cbd5e1;font-size:13px;">{html.escape(label)}</span>
          <span style="color:{color};font-size:13px;font-weight:600;">
            <span style="margin-right:6px;">{icon}</span>{html.escape(value)}</span>
        </div>"""

    content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{{margin:0;padding:0;box-sizing:border-box}}</style></head>
<body style="background:{_BG};min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;display:flex;flex-direction:column;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="width:48px;height:4px;background:{_INDIGO};border-radius:2px;margin:0 auto 20px;"></div>
    <h1 style="color:#f8fafc;font-size:26px;font-weight:700;">{html.escape(title)}</h1>
  </div>
  <div style="flex:1;">{rows}</div>
  <div style="text-align:center;padding-top:20px;">
    <p style="color:#334155;font-size:11px;">PrepMate &middot; AI Interview Prep</p>
  </div>
</body></html>"""

    page.set_content(content)
    page.wait_for_timeout(pause_ms)
    if screenshot_path:
        page.screenshot(path=str(screenshot_path), full_page=False)


# ── Screenshot helper ─────────────────────────────────────────────────────────

def snap(page: Page, out_dir: Path, name: str) -> Path:
    """Take a full-page screenshot and save to *out_dir/screenshots/name.png*."""
    screenshots = out_dir / "screenshots"
    screenshots.mkdir(parents=True, exist_ok=True)
    path = screenshots / f"{name}.png"
    page.screenshot(path=str(path), full_page=False)
    print(f"  [snap] {path.name}")
    return path
