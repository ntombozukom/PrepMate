"""Record a demo video of the CV check: the whole one-page flow with a made-up sample CV.

What it shows (about 50 seconds; the AI steps run for real, so timings vary a little):
  1. The landing page headline and example
  2. Choosing the sample CV, then the score with what works and what to fix
  3. Rewrite my CV, scrolling through the preview, a look at Edit text, then folding it away
  4. A cover letter for a job, then folding it away

The sample CV (Lerato Dlamini, a store manager) is made up and built when the script runs,
so no real person's CV appears in the video.

Output: an MP4 (H.264) that plays inline on WhatsApp, LinkedIn, X and YouTube.
  default    laptop, landscape 1280x720
  --phone    phone, portrait, 720 wide (WhatsApp Status allows up to 60 seconds)

Setup (once):
    python -m pip install playwright imageio-ffmpeg

Run against the local Cloudflare build (in client/: npm run cf:dev, with a Groq key in .dev.vars):
    python tools/demo_video.py
    python tools/demo_video.py --phone --out cv-check-phone.mp4
    python tools/demo_video.py --url https://your-live-site --show
"""

import argparse
import subprocess
import tempfile
import time
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

import imageio_ffmpeg
from playwright.sync_api import Page, sync_playwright

PHONE = {"width": 390, "height": 844}
DESKTOP = {"width": 1280, "height": 720}

# The made-up CV, one line per paragraph, with the common mistakes the check should catch.
SAMPLE_CV = """Lerato Dlamini
Store Manager | Johannesburg | lerato@example.com
PROFILE
I am a hardworking, honest team player. Retail manager with 8 years running busy stores, leading teams and improving customer service.
EXPERIENCE
Store Manager, Sunrise Retail
2018 - present
Responsible for a team of 12
Opened and closed the store, cash-ups and banking
Supervisor, Corner Mart
2015 - 2018
Did stock counts
Trained new cashiers
SKILLS
Team leadership, stock control, customer service, cash handling
EDUCATION
National Senior Certificate, Northview High School, 2014"""


def sample_docx(folder: Path) -> Path:
    """Build a minimal Word file from SAMPLE_CV."""
    body = "".join(
        f'<w:p><w:r><w:t xml:space="preserve">{escape(line)}</w:t></w:r></w:p>' for line in SAMPLE_CV.splitlines()
    )
    path = folder / "Lerato Dlamini CV.docx"
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml",
                   '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr("_rels/.rels",
                   '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr("word/document.xml",
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}</w:body></w:document>')
    return path


def pause(seconds: float) -> None:
    time.sleep(seconds)


def smooth_scroll(page: Page, pixels: int, duration_ms: int = 900, within: str | None = None) -> None:
    """Scroll the page (or one scrolling box) gently, so the video reads like a person using it."""
    page.evaluate(
        """([px, ms, sel]) => new Promise((done) => {
            const el = sel ? document.querySelector(sel) : null;
            const get = () => el ? el.scrollTop : window.scrollY;
            const set = (y) => el ? (el.scrollTop = y) : window.scrollTo(0, y);
            const start = get(), t0 = performance.now();
            const step = (t) => {
                const k = Math.min(1, (t - t0) / ms);
                const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                set(start + px * ease);
                k < 1 ? requestAnimationFrame(step) : done();
            };
            requestAnimationFrame(step);
        })""",
        [pixels, duration_ms, within],
    )


def scroll_to(page: Page, selector: str, offset: int = 24, duration_ms: int = 900) -> None:
    """Bring an element (any Playwright selector) near the top of the screen."""
    box = page.locator(selector).first.bounding_box()  # relative to the current view
    if box:
        smooth_scroll(page, int(box["y"] - offset), duration_ms)


def record(url: str, webm_dir: Path, cv: Path, headless: bool, phone: bool) -> tuple[Path, float]:
    """Record the tour. Returns the video and how many seconds of blank loading to trim off the start."""
    screen = PHONE if phone else DESKTOP
    with sync_playwright() as p:
        # Uses the Chrome already installed on this computer, so no extra browser download.
        browser = p.chromium.launch(channel="chrome", headless=headless)
        context = browser.new_context(
            viewport=screen,
            device_scale_factor=2 if phone else 1,
            is_mobile=phone,
            has_touch=phone,
            record_video_dir=str(webm_dir),
            record_video_size=screen,
        )
        started = time.monotonic()
        page = context.new_page()

        def press(selector: str) -> None:
            """Tap on phone, click on desktop, so the video shows the right interaction."""
            target = page.locator(selector).first
            target.tap() if phone else target.click()

        # 1. Headline and example (everything before the first paint is trimmed off later)
        page.goto(url, wait_until="networkidle")
        trim = max(0.0, time.monotonic() - started - 0.2)
        pause(3.5)

        # 2. Choose the sample CV; the score opens below and the page scrolls to it
        page.set_input_files("input[type=file]", str(cv))
        page.get_by_text("Want these fixed for you?").wait_for(timeout=90_000)
        pause(2.5)
        smooth_scroll(page, 260 if not phone else 520, 1400)
        pause(3)

        # 3. The rewrite, its preview, a look at the text, then fold it away
        scroll_to(page, "text=Want these fixed for you?", offset=200)
        press("button:has-text('Rewrite my CV')")
        page.get_by_text("Your rewritten CV").wait_for(timeout=120_000)
        pause(1)
        scroll_to(page, "button[aria-expanded]:has-text('Your rewritten CV')", offset=40)
        pause(2.5)
        smooth_scroll(page, 520, 2600, within="div.overflow-y-auto")
        pause(1.5)
        press("button[role=tab]:has-text('Edit text')")
        pause(2.5)
        press("button[role=tab]:has-text('Preview')")
        pause(1)
        press("button[aria-expanded]:has-text('Your rewritten CV')")
        pause(1.5)

        # 4. A cover letter for a job, then fold it away
        press("button:has-text('Write one')")
        pause(0.6)
        scroll_to(page, "text=Job title (optional)", offset=120)
        pause(0.6)
        page.locator("input[placeholder='e.g. Store Manager']").type("Store Manager", delay=60)
        page.locator("input[placeholder='e.g. Pick n Pay']").type("Hillcrest Foods", delay=60)
        pause(0.5)
        press("button:has-text('Write my cover letter')")
        page.get_by_text("Your cover letter").wait_for(timeout=120_000)
        pause(1)
        scroll_to(page, "button[aria-expanded]:has-text('Your cover letter')", offset=40)
        pause(3)
        smooth_scroll(page, 300 if not phone else 600, 1800)
        pause(2.5)
        press("button[aria-expanded]:has-text('Your cover letter')")
        pause(0.8)
        # End on the folded-up results: score, rewritten CV and cover letter.
        scroll_to(page, "text=ATS readability >> nth=1", offset=16)
        pause(3.5)

        video_path = Path(page.video.path())
        context.close()  # the video file is finalised when the context closes
        browser.close()
        return video_path, trim


def to_mp4(webm: Path, out: Path, width: int, trim: float) -> None:
    """Convert to an MP4 every social app accepts (H.264, yuv420p, even dimensions)."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg, "-y", "-loglevel", "error",
            "-ss", f"{trim:.2f}", "-i", str(webm),
            "-vf", f"scale={width}:-2:flags=lanczos,fps=30",
            "-c:v", "libx264", "-preset", "slow", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-an",
            str(out),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default="http://127.0.0.1:8787", help="site to record (default: the local Cloudflare build)")
    parser.add_argument("--out", default="cv-check-demo.mp4", help="output MP4 file")
    parser.add_argument("--show", action="store_true", help="show the browser window while recording")
    parser.add_argument("--phone", action="store_true", help="record a portrait phone demo instead of a laptop")
    args = parser.parse_args()

    out = Path(args.out).resolve()
    with tempfile.TemporaryDirectory() as tmp:
        cv = sample_docx(Path(tmp))
        webm, trim = record(args.url, Path(tmp) / "video", cv, headless=not args.show, phone=args.phone)
        to_mp4(webm, out, width=DESKTOP["width"] if not args.phone else 720, trim=trim)
    print(f"Saved {out} ({out.stat().st_size / 1_000_000:.1f} MB)")


if __name__ == "__main__":
    main()
