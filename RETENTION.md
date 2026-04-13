# PrepMate — Retention Strategy

## The Core Problem

Interview prep is point-in-time by nature. Users prep, get the job, and disappear.
The fix: reposition PrepMate from "interview tool" to **career readiness companion** —
delivering ongoing value between job hunts so subscribers have a reason to stay.

---

## Why Users Leave (and the counters)

| Churn reason | Counter |
|---|---|
| "I got the job, I don't need this anymore" | Ongoing career features (see below) |
| "I only interview every 2-3 years" | Annual plan discount + email re-engagement |
| "It's not worth the monthly fee" | Clear value at every login — saved history, bookmarks |
| "I forgot I had it" | Weekly industry digest emails |

---

## Retention Features Roadmap

### Phase 1 — Lock-in (build these first)

**Session history as a moat**
- Full history of every prep session, searchable
- Concept revision tracker — mark concepts as "confident", "shaky", "need to review"
- Downgrading to Free loses history beyond 7 days (natural upgrade incentive)

**Concept bookmarks**
- Bookmark any concept explanation for later revision
- "Saved concepts" tab on the dashboard
- Pro feature — creates a personal knowledge library

**Spaced repetition reminders**
- After saving a concept, schedule a reminder: "You prepped REST APIs 30 days ago — still sharp?"
- Email + in-app notifications
- Based on Ebbinghaus forgetting curve (review at 1 day, 7 days, 30 days)

---

### Phase 2 — Ongoing Value

**In-app feedback widget** *(UI stub shipped in v0.1)*
- "How are you finding PrepMate?" — emoji rating (😕 / 🙂 / 🔥) appears after first session
- Currently: frontend only, localStorage-dismissed
- Next step: POST to `/api/v1/feedback` to capture sentiment + free-text suggestion
- Free-text field: "Anything you'd like to see?" — surfaces feature ideas directly from users

**Interview date check-in**
- When a user creates a prep session, optionally capture: "When is your interview?"
- 24h before the date: send a "You've got this! Here are 3 key concepts to review" email
- 48h after the date: "How did the [Company] interview go?" prompt (see "Did you get the job?" below)
- Backend: add `interviewDate` nullable field to `PrepSession` entity
- Frontend: date picker shown optionally on session create, editable from session detail
- This creates a high-value, time-sensitive engagement moment most competitors miss

**"Did you get the job?" follow-up**
- 2 weeks after a prep session (or 48h after `interviewDate` if set), send: "How did the interview go?"
- Track outcomes — creates emotional investment in the product
- Users who track wins are far more likely to renew

**Monthly industry digest (email)**
- "Top 5 concepts Fintech companies are asking about in March"
- Sourced from real job postings scraped monthly
- Keeps PrepMate top-of-mind even when not actively interviewing
- Pro feature — personalised to their industry

**Internal interview prep mode**
- Separate session type: "I'm going for a promotion"
- Focus shifts from technical concepts to leadership, delivery, impact
- Covers: behavioural questions, salary negotiation, performance review prep
- Opens up a whole new use case that recurs annually

**Salary negotiation prep**
- A prep session focused on: market rates, how to negotiate, what to say
- Links to industry salary benchmarks (ZA market)
- High-value, emotionally resonant — people are anxious about this

---

### Phase 3 — Growth Loops

**Referral system**
- "Give a free month, get a free month"
- Every referred user who subscribes = 1 month added to referrer's plan
- Viral growth + retention in one mechanic

**Teams / Bootcamp plan (R499/mo)**
- For: coding bootcamps, recruitment agencies, university career centres
- Multiple seats, bulk session generation, admin dashboard
- High ACV, low churn (institutional contracts)

**CV Review add-on (R49 one-time)**
- AI-powered CV feedback — not just prep, but getting the interview in the first place
- Upsell at registration and after first session

**Share a session**
- Generate a shareable read-only link to a prep session
- "My mate used PrepMate to prep for her Absa interview" — organic social proof
- Drives new registrations

---

## Engagement Triggers (email / in-app)

| Trigger | Message | Timing |
|---|---|---|
| New user, no CV uploaded | "Upload your CV to unlock personalised answers" | 1 day after signup |
| CV uploaded, no session | "You're set up — paste a JD and generate your first prep" | 1 day after CV upload |
| Session created | "Your concepts are ready. Block 30 mins to read through them." | Immediately |
| 7 days since last session | "Still prepping? Here are 3 Fintech concepts to brush up on." | 7 days inactive |
| 30 days since concept saved | "You saved REST APIs 30 days ago — time for a quick revision?" | Spaced repetition |
| Interview outcome follow-up | "How did the [Company Name] interview go?" | 14 days after session |
| Annual renewal reminder | "Your PrepMate year is coming up. Here's what you achieved." | 30 days before renewal |

---

## Pricing Psychology Notes

- **Anchor on the job outcome**: one interview win = months of salary gained vs. R89/month cost
- **Annual plan = 2 months free**: reduces churn by 60%+ vs monthly (users pre-commit)
- **Free tier is generous enough to be useful, limited enough to feel the constraint**
  - 2 sessions/month and 5 concepts hits the wall quickly for active job seekers
- **Pro tier differentiator = Claude AI**: tangibly better output quality — let users feel the difference

---

## Metrics to Track

- **Day 7 / Day 30 retention** — key health indicators
- **Sessions per user per month** — engagement proxy
- **Free → Prep conversion rate** — product-market fit signal
- **Churn reason survey** — ask on cancellation (single question)
- **Interview outcome rate** — "Did you get the job?" responses
