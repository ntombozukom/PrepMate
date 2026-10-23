/**
 * PrepMate on Cloudflare: serves the built site (dist/) and the no-account CV check API.
 *
 * The browser pulls the text out of the CV, so the file itself never reaches us. The text is sent
 * to Groq for the result and nothing is stored.
 *
 * Flow: /score (cheap model, runs as soon as a CV is picked) → /rewrite (stronger model, only when
 * the visitor asks) → /cover-letter (optional). The Turnstile bot check runs once on /score, which
 * hands back a short-lived pass for the other two.
 */
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  ASSETS: Fetcher;
  RATE_LIMITER: DurableObjectNamespace<RateLimiter>;
  GROQ_API_KEY: string;
  /** Rewrite and cover letter. */
  GROQ_MODEL: string;
  /** The quick score: a smaller, cheaper model. */
  GROQ_SCORE_MODEL: string;
  TURNSTILE_SECRET_KEY: string;
  AI_REQUESTS_PER_HOUR: string;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_BODY_BYTES = 200_000;
const MIN_CV_CHARS = 50;
const MAX_CV_CHARS = 20_000;
const PASS_TTL_MS = 60 * 60_000;

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);

    try {
      if (pathname === '/api/v1/features' && request.method === 'GET')
        return json({ jobPrep: false, accounts: false });

      if (pathname === '/api/v1/ats/score' && request.method === 'POST')
        return await score(request, env);

      if (pathname === '/api/v1/ats/rewrite' && request.method === 'POST')
        return await rewrite(request, env);

      if (pathname === '/api/v1/ats/cover-letter' && request.method === 'POST')
        return await coverLetter(request, env);

      if (pathname.startsWith('/api/')) return problem(404, 'Not found.');
    } catch (e) {
      if (e instanceof Problem) return problem(e.status, e.title, e.errors);
      console.error('Unhandled error', e);
      return problem(500, 'An unexpected error occurred.');
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Score, what works and what to fix. No rewrite, so it is quick and cheap. */
async function score(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const cv = cvSnippet(body.cvText);
  await verifyTurnstile(body.turnstileToken, request, env);
  await rateLimit(request, env);

  const systemPrompt =
    'You are an ATS (Applicant Tracking System) expert and an experienced recruiter. You assess CVs for how ' +
    'well ATS software and recruiters can read them. You only comment on what is actually in the CV in front ' +
    'of you, never generic advice. Return valid JSON only.';

  const userPrompt = `Assess this CV for ATS compatibility. Do not rewrite it.

## CV
${cv.text}

Look for these problems, and report only the ones that are really in this CV:
- Date lines that also carry other text (e.g. a reason for leaving after the dates).
- Section headings an ATS may not recognise.
- Bullets that list duties with no outcome, where the CV gives nothing about the result.
- Vague or generic wording, clichés, and spelling or duplicate words.
- Job titles or employers that are hard to pick out.
Layout problems (columns, tables, stray bullet symbols) and missing contact details are checked separately:
do not mention them.

Every issue MUST quote a short, exact phrase from the CV (copied character for character, at most 12 words)
that shows the problem. If you cannot quote it, leave the issue out. Do not mention emojis, graphics, photos,
fonts or file formats: you cannot see them. Never suggest adding skills, tools or experience the candidate
may not have; for keywords, tell them to use the words from the job ad they're applying for.

Return JSON with exactly these fields:
{
  "score": integer 0-100 (ATS compatibility score),
  "strengths": ["3-5 things this CV does well for ATS, each a short sentence"],
  "issues": [{ "issue": "what to change, one short sentence", "quote": "exact phrase from the CV" }]
}
Give 0-5 issues. Fewer, accurate issues are better than many weak ones.`;

  const root = firstJsonObject(await callGroq(env, env.GROQ_SCORE_MODEL, systemPrompt, userPrompt, 3000));
  // Never show a made-up score: if the reply can't be read, say so and let them try again.
  if (typeof root?.score !== 'number' || stringList(root.strengths).length === 0)
    throw unreadableReply("We couldn't check this CV just now. Please try again.");

  // Keep only the AI's issues whose quote really is in the CV, then add the checks done in code.
  const aiIssues = (Array.isArray(root.issues) ? root.issues : [])
    .filter((i): i is { issue: string; quote: string } =>
      typeof i?.issue === 'string' && typeof i?.quote === 'string' && i.quote.trim().length > 2 &&
      normalise(cv.text).includes(normalise(i.quote)))
    .map((i) => ({ text: i.issue.trim(), quote: i.quote.trim() }));
  const merged = new Map<string, Issue>();
  for (const i of aiIssues) {
    const same = merged.get(i.text.toLowerCase());
    if (same) same.quote = same.quote ? `${same.quote}” and “${i.quote}` : i.quote;
    else merged.set(i.text.toLowerCase(), { ...i });
  }
  const dropped = (Array.isArray(root.issues) ? root.issues.length : 0) - aiIssues.length;
  if (dropped > 0) console.warn(`Dropped ${dropped} issue(s) with no matching quote`);

  return json({
    score: Math.max(0, Math.min(100, Math.round(root.score))),
    strengths: stringList(root.strengths),
    issues: [...layoutAndContactIssues(cv.text), ...merged.values()],
    cvWasTruncated: cv.truncated,
    pass: await issuePass(env),
  });
}

/** Today as "October 2026", so the AI can tell which role is current. */
const today = () =>
  new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });

/** Lowercase, single spaces, plain dashes and quotes: so a quote matches however the AI typed it. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

type Issue = { text: string; quote?: string };

/** Checks that don't need AI, so they are always right: layout signs in the text and contact details. */
function layoutAndContactIssues(cvText: string): Issue[] {
  const issues: Issue[] = [];
  const lines = cvText.split('\n').map((l) => l.trim());

  // Two bullets on one line means the list is laid out in columns or a table, which ATS often jumble.
  const columnLine = lines.find((l) => (l.match(/[•▪◦●]/g) ?? []).length >= 2);
  if (columnLine)
    issues.push({
      text: 'Some lists are laid out in two columns, which ATS often read in the wrong order. Use one item per line.',
      quote: columnLine.length > 70 ? `${columnLine.slice(0, 70)}…` : columnLine,
    });

  // Bullet symbols on a line of their own usually come from tables or hand-typed bullets.
  if (lines.filter((l) => /^[•▪◦●\-*]$/.test(l)).length >= 3)
    issues.push({
      text: "Some bullet symbols sit on a separate line from their text, which usually comes from a table. Use Word's normal bullet list.",
    });

  if (!/[\w.+-]+@[\w-]+\.[\w.]+/.test(cvText))
    issues.push({ text: 'No email address found. Add one near your name.' });
  if (!/(\+?\d[\d\s()-]{7,}\d)/.test(cvText))
    issues.push({ text: 'No phone number found. Add one near your name.' });
  if (!/linkedin\.com\//i.test(cvText))
    issues.push({ text: 'No LinkedIn profile link. Many recruiters look for one next to your contact details.' });

  return issues;
}

/** The full rewrite, only when the visitor asks for it. */
async function rewrite(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const cv = cvSnippet(body.cvText);
  await checkPass(request, env);
  await rateLimit(request, env);

  const systemPrompt =
    'You are an ATS (Applicant Tracking System) optimisation expert who rewrites CVs so ATS software ' +
    'and recruiters can read them easily. Return valid JSON only.';

  const userPrompt = `Rewrite this CV for ATS compatibility.

## CV
${cv.text}

STRICT RULES. The candidate will send this to employers, so every word must be true:
- Use ONLY facts stated in the CV above. Do NOT add numbers, percentages, amounts, team sizes, dates,
  employers, job titles, qualifications, tools, technologies, skills, certifications or responsibilities
  that are not in it. Do not exaggerate what is there.
- You MAY: reword, use stronger action verbs, turn sentences into bullet points, reorder sections, rename
  headings to standard ones (Summary, Experience, Education, Skills), fix spelling, and remove tables or columns.
- KEEP THE DETAIL. Specific details are what make a CV strong: keep every technical term, system, number,
  client type and outcome. Never shorten a bullet that is already clear and specific into something vaguer
  (e.g. do not turn "making sure a cancellation and a payout could never both go through" into "ensured
  correct processing"). If a bullet is already good, leave it as it is.
- Keep the candidate's verbs when they show ownership ("Led", "Took over", "Co-led", "Built"); never swap them
  for weaker ones ("Worked on", "Maintained", "Helped with").
- Put everything in one column and remove stray bullet symbols on lines of their own. Write skills as a few
  short grouped lines, e.g. "Cloud: Microsoft Azure (AKS, Blob Storage), Kubernetes", not one skill per line.
- Keep the tense: present tense for a current role (one ending in "present", or in a date after ${today()}),
  past tense for earlier roles.
- Keep every qualifier exactly as written: contract types such as "(6m FTC)" or "(Contract)", and what a
  qualification is, such as "(Training Certificate)" or "in progress". Removing them misrepresents the candidate.
- Remove reasons for leaving from date lines (e.g. "Retrenched", "Relocation"); keep the dates.
- Fix obvious duplicates and typos, e.g. "Microsoft Azure (AKS, Blob Storage, Azure)" lists Azure twice.
- Where a bullet describes a duty with no result at all, you may add a short placeholder in square brackets
  for the candidate to fill in, e.g. "[add result, e.g. cut costs by X%]". Never add one to a bullet that
  already states a result. At most 3 placeholders in the whole CV.

FORMAT rewrittenCv exactly like this, in plain text (it is turned into a Word and PDF file):
- Line 1: the full name. Line 2: the headline, if the CV has one. Next line: contact details separated by " | ".
- Section headings in CAPITALS on their own line, e.g. SUMMARY, SKILLS, EXPERIENCE, EDUCATION, CERTIFICATIONS.
- SKILLS: one line per group, "Group name: item, item, item". No bullets.
- EXPERIENCE: for each job, "Job Title – Company" on one line, the dates on the next line, then one "- " bullet
  per point. A label inside a bullet is fine, e.g. "- Key achievement: …". A blank line between jobs.
- EDUCATION (and certifications): one "- " bullet per qualification, "- Qualification – Institution, Years".
- A blank line before each section heading.

Return JSON with exactly these fields:
{
  "changes": ["4-7 specific changes you made, each a short sentence"],
  "keywordsEmphasised": ["6-10 keywords or phrases from the CV that the rewrite makes easier to find"],
  "rewrittenCv": "The COMPLETE rewritten CV as plain text, every section kept. Use \\n for line breaks."
}`;

  const ask = async (extra = '') => {
    const root = firstJsonObject(await callGroq(env, env.GROQ_MODEL, systemPrompt, userPrompt + extra, 8000));
    const rewrittenCv = typeof root?.rewrittenCv === 'string' ? root.rewrittenCv : '';
    return { root, rewrittenCv, invented: inventedFigures(cv.text, rewrittenCv) };
  };

  let result = await ask();
  // The model sometimes adds results that aren't in the CV. Ask once more, naming them.
  if (result.rewrittenCv && result.invented.length > 0) {
    console.warn('Rewrite added figures not in the CV, retrying:', result.invented);
    const retry = await ask(`\n\nIMPORTANT: A previous draft added figures that are NOT in the CV: ${result.invented.join(', ')}. ` +
      'Remove them. Use a [placeholder] instead if a result would help.');
    if (retry.rewrittenCv) result = retry;
  }
  if (!result.rewrittenCv.trim()) throw unreadableReply("We couldn't rewrite this CV just now. Please try again.");

  return json({
    rewrittenCv: result.rewrittenCv,
    changes: stringList(result.root?.changes),
    keywordsAdded: stringList(result.root?.keywordsEmphasised),
    /** Figures still in the rewrite that aren't in the original, for the visitor to check. */
    unverifiedFigures: result.invented,
    cvWasTruncated: cv.truncated,
  });
}

/**
 * Numbers in the rewrite (outside [placeholders]) that don't appear anywhere in the original CV,
 * e.g. an invented "30%". Digits only, so "2 million" is fine when the CV says 2 million.
 */
function inventedFigures(original: string, rewritten: string): string[] {
  const figures = (text: string) => text.match(/\d+(?:[.,]\d+)*%?/g) ?? [];
  const known = new Set(figures(original).map((f) => f.replace(/[,%]/g, '')));
  const outsidePlaceholders = rewritten.replace(/\[[^\]]*\]/g, '');
  return [...new Set(figures(outsidePlaceholders).filter((f) => !known.has(f.replace(/[,%]/g, ''))))];
}

async function coverLetter(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const cv = cvSnippet(body.cvText);
  const jdSnippet = optionalText(body.jobDescriptionText, 'JobDescriptionText', 20_000)?.slice(0, 4000);
  const jobTitle = optionalText(body.jobTitle, 'JobTitle', 200);
  const companyName = optionalText(body.companyName, 'CompanyName', 200);
  await checkPass(request, env);
  await rateLimit(request, env);

  const systemPrompt =
    'You are an expert career coach who writes compelling, personalised cover letters that are completely ' +
    'true to the candidate\'s CV. Write in a confident, professional tone. Return valid JSON only.';

  const jdSection = jdSnippet
    ? `## Job Description\n${jdSnippet}`
    : 'No specific job description provided — write a strong general cover letter based on the CV.';
  const roleSection = jobTitle ? `\nRole: ${jobTitle}` : '';
  const companySection = companyName ? `\nCompany: ${companyName}` : '';

  const userPrompt = `Write a professional cover letter for this candidate.${roleSection}${companySection}

## Candidate CV
${cv.text}

${jdSection}

STRICT RULES. The candidate will send this to an employer, so every claim must be true:
- Use ONLY facts stated in the CV. Do NOT add numbers, percentages, volumes ("thousands of transactions"),
  results, awards, compliance claims or responsibilities that are not in it. Do not exaggerate.
- Keep the candidate's own words for what they did ("took over" stays "took over", not "built").
- Do not state a total number of years of experience unless the CV states it.
- Say nothing about the company beyond what the job description says; do not invent its values or plans.

Guidelines:
- 3-4 paragraphs: opening hook, relevant experience, why they fit this role, closing
- Pick the 2-3 most relevant achievements from the CV and describe them specifically
- If a job description is provided, mirror its key language and requirements where the CV supports them
- Sound like a confident professional, not a template. Do NOT open with "I am writing to apply for..."
- Keep it under 350 words

Return JSON: { "coverLetter": "full cover letter text with \\n\\n paragraph breaks", "tone": "Professional|Enthusiastic|Executive" }`;

  // Figures may come from the CV or the job ad (e.g. a salary band or team size in the ad).
  const known = [cv.text, jdSnippet ?? '', jobTitle ?? '', companyName ?? ''].join('\n');
  const ask = async (extra = '') => {
    const root = firstJsonObject(await callGroq(env, env.GROQ_MODEL, systemPrompt, userPrompt + extra, 3000));
    const letter = typeof root?.coverLetter === 'string' ? root.coverLetter.trim() : '';
    return { root, letter, invented: inventedFigures(known, letter) };
  };

  let result = await ask();
  if (result.letter && result.invented.length > 0) {
    console.warn('Cover letter added figures not in the CV, retrying:', result.invented);
    const retry = await ask(`\n\nIMPORTANT: A previous draft added figures that are NOT in the CV: ${result.invented.join(', ')}. ` +
      'Remove them and any other claim the CV does not support.');
    if (retry.letter) result = retry;
  }
  if (!result.letter) throw unreadableReply("We couldn't write this cover letter just now. Please try again.");

  return json({
    coverLetter: result.letter,
    tone: typeof result.root?.tone === 'string' ? result.root.tone : 'Professional',
    unverifiedFigures: result.invented,
  });
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function callGroq(env: Env, model: string, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0,
        // gpt-oss models think before answering and that thinking is billed as output; keep it short.
        ...(model.startsWith('openai/gpt-oss') && { reasoning_effort: 'low' }),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    console.error('Groq request failed', e);
    throw aiUnavailable();
  }

  if (!response.ok) {
    // Logged for us; the visitor only sees the friendly message.
    console.error(`Groq API error ${response.status}: ${await response.text()}`);
    throw aiUnavailable();
  }

  const data = await response.json<{
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }>();
  console.log(`Groq ${model}: ${data.usage?.prompt_tokens ?? '?'} in, ${data.usage?.completion_tokens ?? '?'} out`);
  return data.choices?.[0]?.message?.content ?? '';
}

/** The AI answered but not in a form we can show. Logged; the visitor is asked to try again. */
function unreadableReply(message: string): Problem {
  console.error('Unreadable AI reply:', message);
  return new Problem(502, message);
}

const aiUnavailable = () =>
  new Problem(503, 'The CV check is busy right now. Please try again in a few minutes.');

/**
 * Finds the first top-level {...} in the model's reply, ignoring prose or code fences around it,
 * and escapes bare newlines inside strings (some models emit them, which is invalid JSON).
 */
function firstJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0, inString = false, escape = false, out = '';
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; out += c; continue; }
    if (c === '\\' && inString) { escape = true; out += c; continue; }
    if (c === '"') { inString = !inString; out += c; continue; }
    if (inString) {
      out += c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : c;
      continue;
    }
    out += c;
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { return JSON.parse(out) as Record<string, unknown>; } catch { return null; }
    }
  }
  return null;
}

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];

// ─── Bot check: Turnstile once, then a signed pass ──────────────────────────────

const botFailed = () =>
  new Problem(403, "We couldn't confirm you're a person. Please refresh the page and try again.");

async function verifyTurnstile(token: unknown, request: Request, env: Env): Promise<void> {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set');
    throw aiUnavailable();
  }
  if (typeof token !== 'string' || !token) throw botFailed();

  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
  form.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);

  const result = await fetch(TURNSTILE_URL, { method: 'POST', body: form })
    .then((r) => r.json<{ success?: boolean }>())
    .catch(() => ({ success: false }));
  if (!result.success) throw botFailed();
}

async function passKey(env: Env): Promise<CryptoKey> {
  const secret = new TextEncoder().encode(`prepmate-pass:${env.TURNSTILE_SECRET_KEY}`);
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** "<expiry>.<signature>", so rewrite and cover letter don't need a fresh bot check each time. */
async function issuePass(env: Env): Promise<string> {
  const expiry = String(Date.now() + PASS_TTL_MS);
  const sig = await crypto.subtle.sign('HMAC', await passKey(env), new TextEncoder().encode(expiry));
  return `${expiry}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

async function checkPass(request: Request, env: Env): Promise<void> {
  const [expiry, sig] = (request.headers.get('X-Check-Pass') ?? '').split('.');
  if (!expiry || !sig) throw botFailed();
  if (Number(expiry) < Date.now())
    throw new Problem(403, 'This check has expired. Please choose your CV again.');

  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0)); } catch { throw botFailed(); }
  const valid = await crypto.subtle.verify('HMAC', await passKey(env), bytes, new TextEncoder().encode(expiry));
  if (!valid) throw botFailed();
}

// ─── Rate limit: N AI requests per IP per hour ──────────────────────────────────

/** One instance per visitor IP, holding a fixed one-hour window. */
export class RateLimiter extends DurableObject<Env> {
  async hit(limit: number): Promise<boolean> {
    const now = Date.now();
    const window = (await this.ctx.storage.get<{ start: number; count: number }>('w')) ?? { start: now, count: 0 };
    if (now - window.start >= 3_600_000) { window.start = now; window.count = 0; }
    if (window.count >= limit) return false;
    window.count++;
    await this.ctx.storage.put('w', window);
    return true;
  }
}

/** Counts one AI request for this visitor, called after validation so mistakes don't use up their checks. */
async function rateLimit(request: Request, env: Env): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const limit = Number(env.AI_REQUESTS_PER_HOUR) || 10;
  const allowed = await env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(ip)).hit(limit);
  if (!allowed) throw new Problem(429, "You've reached the limit for now. Please try again in an hour.");
}

// ─── Request and response helpers ───────────────────────────────────────────────

class Problem extends Error {
  constructor(public status: number, public title: string, public errors: Record<string, string[]> = {}) {
    super(title);
  }
}

const validation = (field: string, message: string) =>
  new Problem(422, 'One or more validation errors occurred.', { [field]: [message] });

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) throw validation('CvText', 'This CV is too long to check.');
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw validation('CvText', 'This CV is too long to check.');
  try {
    const body = JSON.parse(raw);
    if (body && typeof body === 'object') return body as Record<string, unknown>;
  } catch { /* fall through */ }
  throw new Problem(400, 'The request could not be read.');
}

/** The CV text, trimmed to the AI limit. Longer CVs are flagged so the visitor is warned. */
function cvSnippet(value: unknown): { text: string; truncated: boolean } {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < MIN_CV_CHARS)
    throw validation('CvText', 'We could not find any text in this file. If it is a scan or photo, please upload the original Word or PDF version.');
  return text.length > MAX_CV_CHARS
    ? { text: text.slice(0, MAX_CV_CHARS), truncated: true }
    : { text, truncated: false };
}

function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw validation(field, `${field} must be text.`);
  if (value.length > max) throw validation(field, `${field} is too long.`);
  return value.trim() || undefined;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const problem = (status: number, title: string, errors: Record<string, string[]> = {}) =>
  new Response(JSON.stringify({ title, status, errors }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
