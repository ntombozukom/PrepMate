# Next steps

Where the CV check stands and what to pick up next. Last updated 23 October 2026.

## Where things are

The app launches as a **no-account CV check** on Cloudflare. Accounts and interview prep are built but switched off.

- **One page does everything.** On the landing page you choose a CV, see the score, ask for a rewrite, and optionally write a cover letter. The rewrite has a Preview / Edit text switch and downloads as Word or PDF. The rewritten CV and the cover letter can both be folded away.
- **Privacy:** the browser reads the PDF or Word file, and only the text is sent. Nothing is saved.
- **Cloudflare Worker** (`client/worker/index.ts`) serves the site and the API:
  - `POST /api/v1/ats/score`: the bot check (Turnstile), then the score. Each "what to fix" point must quote the CV, or it's dropped. Layout and contact checks run in code.
  - `POST /api/v1/ats/rewrite`: strict no-invention rules, an automatic retry if figures appear that aren't in the CV, and a warning naming any that remain.
  - `POST /api/v1/ats/cover-letter`: the same no-invention rules and figure check.
  - Rate limit: 10 AI requests per IP per hour, counted in a Durable Object.
- **Model:** `openai/gpt-oss-120b` on Groq for all three steps. `llama-3.3-70b-versatile` was retired on 16 Aug 2026.
- **Cost:** about 1c per check plus a few cents per rewrite. Roughly R30–50 per 1,000 people.
- **Web demo** (private, share from its menu): https://claude.ai/artifact/9BnCkU4SdhqPAoc98X9pEv
- **Demo video:** `cv-check-demo.mp4` in the repo root. It's git-ignored; re-record with `python tools/demo_video.py`.

### Git

- Branch `feat/cloudflare`, commit `3a87055` "Launch the no-account CV check on Cloudflare". Not pushed.
- **Not committed yet:**
  - the new tab icon and title (`client/index.html`, `client/public/favicon.svg`);
  - smaller buttons and a drop box that fits its contents (`client/src/components/CvCheck.tsx`);
  - the video recorder (`tools/demo_video.py`);
  - `*.mp4` in `.gitignore`;
  - this file.
- The GitHub repo `ntombozukom/PrepMate` is **public**. Decide whether it should be private before pushing.

## Decide first

1. **The app name.** "PrepMate" is taken. The tab already uses the working title "CV Check". The logo, footer and FAQ still say PrepMate in about 7 files under `client/src`.
   - Shortlist: NextRole, CV Mate, CVClear, ReadyCV, Shortlist, Hireable.
   - Before you pick, check the `.co.za` domain and search the CIPC trade mark register.
   - The .NET project names (`PrepMate.*`) aren't public and can stay for now.
2. **Hero line.** It currently says "…download an editable Word version", but PDF is offered too. You could end it with "…download it as Word or PDF".
3. **Repo visibility:** public or private.

## Before going live

- [ ] **Rotate the Groq key.** It was pasted in chat. Make a new one at https://console.groq.com/keys, delete the old one, and update `client/.dev.vars`.
- [ ] **Groq Zero Data Retention.** Turn it on in Groq console → Data Controls. Then shorten the "What happens to my CV?" FAQ in `client/src/pages/AtsLanding.tsx` to say the AI provider doesn't keep it either.
- [ ] **Groq paid plan and a spending cap.** The free plan's tokens-per-minute limit is too low for a public site. Set a monthly cap of R170–340.
- [ ] **Turnstile keys.** In the Cloudflare dashboard, go to Turnstile → Add site, using your domain.
- [ ] **Cloudflare Worker from GitHub.** Go to Workers → Create → connect the repo.
  - Root directory: `client`
  - Build command: `npm run build`
  - Deploy command: `npx wrangler deploy`
  - Build variable: `VITE_TURNSTILE_SITE_KEY` (the public site key)
  - Worker secrets: `GROQ_API_KEY` and `TURNSTILE_SECRET_KEY`
  - Add the custom domain.
- [ ] **Privacy page** to match the FAQ: what's sent to Groq, US storage, no training, how long it's kept.
- [ ] **After deploy:** run a real CV through score → rewrite → Word / PDF → cover letter on the live site, then re-record the video with `--url`.

## Known issues to fix

- **Cover letter still stretches wording slightly.** The last run said "mentored" where the CV says "trained", and "sharpened my attention to detail". To fix, tighten the prompt in `coverLetter()` in `worker/index.ts`: no personal qualities or lessons learned unless the CV states them.
- **Tense for the current role.** The rewrite tends to use past tense for a job that's still running. The prompt passes today's date, but the model doesn't always follow it.
- **Logo says PrepMate.** It's in the video and the app header. This is fixed with the rename.
- **The .NET CV Tools page** (signed-in users, off for now) still uses the old prompts that can invent content. Port the Worker's rules when accounts come back.
- **Errors that were already in the code:**
  - unused imports in `client/src/App.tsx` (UploadCvPage, NewSessionPage);
  - TS1294 in `client/src/types/api.ts`;
  - lint errors in `DashboardPage.tsx` and `AuthContext.tsx`.
- **From the first review, for when accounts come back:**
  - `DebugController` should be removed before production;
  - CORS allows any origin;
  - migrations are split across two folders.

## Later

- Bring accounts and interview prep back: `Features:Accounts` and `Features:JobPrep` in `src/PrepMate.API/appsettings.json`, plus the client routes. The "Notify me" waitlist is built.
- A daily cap for the whole site in the Worker, as a hard ceiling on the AI bill.
- Payment ideas: keep the score free, and charge for interview prep, tailoring the CV to a job, and more rewrites. A once-off pass such as "R49 for a week" may suit South Africa better than a subscription. PayFast, Yoco or Paystack can take payments.
- A phone version of the video: `python tools/demo_video.py --phone`.

## How to run it locally

```bash
cd client
npm install
npm run cf:dev          # builds and runs site + Worker on http://127.0.0.1:8787
```

- `client/.dev.vars` (git-ignored) needs `GROQ_API_KEY=...`. It already has Cloudflare's test Turnstile secret, and `AI_REQUESTS_PER_HOUR=100` for testing.
- After changing the site, rebuild with `npx vite build --mode cfdev`. The Worker reloads its own code.
- `npm run dev:cf` runs the Vite dev server on port 3000 with live reload, sending `/api` to the Worker on 8787.
- `npm run dev` is the old setup against the .NET API on 5050. The CV check doesn't work there.

### Files that matter

| File | What it is |
|---|---|
| `client/worker/index.ts` | Worker: prompts, checks, bot check, rate limit |
| `client/wrangler.jsonc` | Worker config: models, rate limit, Durable Object |
| `client/src/pages/AtsLanding.tsx` | Landing page, example card, FAQ |
| `client/src/components/CvCheck.tsx` | Upload box, score, rewrite, cover letter |
| `client/src/components/CvPreview.tsx` | On-page preview of the rewritten CV |
| `client/src/lib/cvText.ts` | Reads PDF and Word in the browser |
| `client/src/lib/cvExport.ts` | Word and PDF layout (shared with the preview) |
| `client/src/lib/turnstile.ts` | Bot check widget |
| `tools/demo_video.py` | Records the demo video |
