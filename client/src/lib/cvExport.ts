/**
 * Turns the plain-text ATS rewrite into a file laid out the standard ATS-friendly way: one column,
 * no tables or text boxes, bold capital headings with a rule, each job as a bold "Title – Company" line
 * with its dates and bullets underneath, bold skill groups, and education as bullets.
 * Word is for editing; PDF is for sending as is (real text, not an image, so ATS can read it).
 * The libraries load only when someone downloads, to keep the page light.
 */

const SECTION_HEADINGS = [
  'professional summary', 'summary', 'profile', 'career objective', 'objective',
  'experience', 'work experience', 'professional experience', 'employment history',
  'education', 'qualifications', 'skills', 'technical skills', 'key skills', 'core competencies',
  'certifications', 'certificates', 'licences', 'licenses', 'projects', 'achievements',
  'awards', 'languages', 'volunteering', 'volunteer experience', 'interests', 'references',
  'contact', 'contact details', 'personal details', 'publications', 'training', 'courses',
];

/** Sections made of jobs, where a plain line starts a new job. */
const ENTRY_SECTIONS = /experience|employment|projects|volunteer/i;
/** Sections made of qualifications, shown as bullets with the qualification in bold. */
const EDUCATION_SECTIONS = /education|qualification|certif|training|courses|licen/i;

const BULLET = /^\s*[-•*▪·◦]\s+/;
const YEAR = /\b(19|20)\d{2}\b|\bpresent\b/i;

/** A line of text with an optional bold part at the start, e.g. "Cloud:" or a qualification name. */
export type Rich = { bold?: string; text: string };

export type Block =
  | { kind: 'name' | 'contact' | 'heading' | 'dates'; text: string }
  | { kind: 'entry' | 'bullet' | 'line'; rich: Rich };

function isHeading(line: string): boolean {
  const text = line.trim().replace(/:$/, '');
  if (!text || text.length > 40) return false;
  if (SECTION_HEADINGS.includes(text.toLowerCase())) return true;
  // ALL-CAPS short lines (e.g. "WORK EXPERIENCE") are headings in most CVs.
  return /[A-Z]/.test(text) && text === text.toUpperCase() && !/[.!?]$/.test(text);
}

/** "June 2026 – November 2026", "2019 – present" and the like. */
const isDateLine = (line: string) => YEAR.test(line) && line.length <= 60 && !/[.!?]$/.test(line);

/** "Cloud: Azure, Kubernetes" → bold "Cloud:". Only short labels, so ordinary sentences stay plain. */
function withLabel(text: string): Rich {
  const m = text.match(/^([^:]{2,45}):\s+(.+)$/);
  return m && !/https?$/i.test(m[1]) ? { bold: `${m[1]}:`, text: ` ${m[2]}` } : { text };
}

/** "BSc in IT – Richfield, 2016 – 2019" → bold "BSc in IT", the rest plain. */
function qualification(text: string): Rich {
  const m = text.match(/^(.+?)\s+([–—|-])\s+(.+)$/);
  return m ? { bold: m[1], text: ` ${m[2]} ${m[3]}` } : { bold: text, text: '' };
}

/** The CV as layout blocks, shared by the Word and PDF files and the on-page preview. */
export function toBlocks(cvText: string): Block[] {
  const blocks: Block[] = [];
  let section = '';
  let beforeFirstHeading = true;

  for (const raw of cvText.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    if (blocks.length === 0) { blocks.push({ kind: 'name', text: line }); continue; }
    if (isHeading(line)) {
      section = line.replace(/:$/, '');
      beforeFirstHeading = false;
      blocks.push({ kind: 'heading', text: section.toUpperCase() });
      continue;
    }
    if (beforeFirstHeading) { blocks.push({ kind: 'contact', text: line }); continue; }

    const isEducation = EDUCATION_SECTIONS.test(section);
    const last = blocks[blocks.length - 1];
    if (BULLET.test(line)) {
      const text = line.replace(BULLET, '').trim();
      blocks.push({ kind: 'bullet', rich: isEducation ? qualification(text) : withLabel(text) });
    } else if (isEducation) {
      // A year-only line ("Amazon Web Services | 2026") under a qualification joins it.
      if (isDateLine(line) && last?.kind === 'bullet' && !YEAR.test(last.rich.text + (last.rich.bold ?? '')))
        last.rich.text += ` – ${line}`;
      else blocks.push({ kind: 'bullet', rich: qualification(line) });
    } else if (ENTRY_SECTIONS.test(section)) {
      // In jobs: a date line belongs to the job above, anything else starts a new job.
      if (isDateLine(line) && last?.kind === 'entry') blocks.push({ kind: 'dates', text: line });
      else blocks.push({ kind: 'entry', rich: { bold: line, text: '' } });
    } else {
      blocks.push({ kind: 'line', rich: withLabel(line) });
    }
  }
  return blocks;
}

function save(blob: Blob, originalFileName: string, ext: string) {
  const base = originalFileName.replace(/\.[^.]+$/, '') || 'CV';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${base} - ATS.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Word ─────────────────────────────────────────────────────────────────────

export async function downloadCvDocx(cvText: string, originalFileName: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const runs = (r: Rich) => [
    ...(r.bold ? [new TextRun({ text: r.bold, bold: true })] : []),
    ...(r.text ? [new TextRun(r.text)] : []),
  ];

  const children = toBlocks(cvText).map((b) => {
    switch (b.kind) {
      case 'name':
        return new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: b.text, bold: true, size: 36 })] });
      case 'contact':
        return new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: b.text, color: '444444' })] });
      case 'heading':
        return new Paragraph({
          spacing: { before: 280, after: 100 },
          keepNext: true,
          border: { bottom: { style: 'single', size: 6, color: '999999', space: 2 } },
          children: [new TextRun({ text: b.text, bold: true, size: 24 })],
        });
      case 'entry':
        return new Paragraph({ spacing: { before: 200, after: 0 }, keepNext: true, children: runs(b.rich) });
      case 'dates':
        return new Paragraph({
          spacing: { after: 60 },
          keepNext: true,
          children: [new TextRun({ text: b.text, italics: true, color: '555555' })],
        });
      case 'bullet':
        return new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: runs(b.rich) });
      default:
        return new Paragraph({ spacing: { after: 60 }, children: runs(b.rich) });
    }
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } }, // 11pt
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      children,
    }],
  });
  save(await Packer.toBlob(doc), originalFileName, 'docx');
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * jsPDF's built-in Helvetica only has Western European characters. Swap the common lookalikes
 * (non-breaking hyphens and spaces, odd bullets) and drop accents it can't draw, rather than
 * printing gaps.
 */
function pdfSafe(text: string): string {
  return text
    .replace(/[\u2010\u2011\u2012\u2212]/g, '-')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[\u25aa\u25e6]/g, '\u2022')
    .replace(/[^\x20-\x7e\u00a1-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u20ac]/g, (c) => c.normalize('NFKD').replace(/[^\x20-\x7e]/g, ''));
}

export async function downloadCvPdf(cvText: string, originalFileName: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 54;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - margin;
  let y = margin;

  const ensure = (space: number) => { if (y + space > bottom) { pdf.addPage(); y = margin; } };

  /** Writes an optional bold part then plain text, wrapping word by word so both can share a line. */
  const write = (rich: Rich, size: number, opts: { indent?: number; after?: number; italic?: boolean; grey?: number } = {}) => {
    const { indent = 0, after = 3, italic = false, grey = 0 } = opts;
    const lineHeight = size * 1.35;
    const left = margin + indent;
    const right = margin + width;
    pdf.setFontSize(size);
    pdf.setTextColor(grey);
    ensure(lineHeight);
    let x = left;

    // Words are drawn one at a time with spaces added by measured width, so bold and plain can share
    // a line. `space` marks a word that had a space before it (so "Cloud:" + " Azure" keeps its gap).
    const pieces: { w: string; bold: boolean; space: boolean }[] = [];
    const add = (text: string, bold: boolean) =>
      pdfSafe(text).split(/( +)/).forEach((part, i, all) => {
        if (part.trim()) pieces.push({ w: part, bold, space: i > 0 && /^ +$/.test(all[i - 1]) });
      });
    if (rich.bold) add(rich.bold, true);
    add(rich.text, false);

    const font = (bold: boolean) => pdf.setFont('helvetica', bold ? 'bold' : italic ? 'italic' : 'normal');

    // Break into lines by measured width, then draw each run of one font as a single string, so the
    // PDF places its own spaces. (Measuring word by word loses spaces after letters like "T", whose
    // measured width doesn't match how it's drawn.)
    const lines: { text: string; bold: boolean }[][] = [[]];
    for (const { w, bold, space } of pieces) {
      font(bold);
      const gap = x > left && space ? pdf.getTextWidth(' ') : 0;
      const wWidth = pdf.getTextWidth(w);
      if (x > left && x + gap + wWidth > right) {
        lines.push([]);
        x = left;
      }
      const line = lines[lines.length - 1];
      const run = line[line.length - 1];
      const sep = x > left && space ? ' ' : '';
      if (run && run.bold === bold) run.text += sep + w;
      else line.push({ text: sep + w, bold });
      x += (x > left ? gap : 0) + wWidth;
    }

    lines.forEach((line, i) => {
      if (i > 0) { y += lineHeight; ensure(lineHeight); }
      let runX = left;
      for (const run of line) {
        font(run.bold);
        pdf.text(run.text, runX, y + size);
        // Sum letter by letter: the whole-string width is kerned and comes out short of what is drawn.
        runX += [...run.text].reduce((sum, c) => sum + pdf.getTextWidth(c), 0);
      }
    });
    y += lineHeight + after;
    pdf.setTextColor(0);
  };

  for (const b of toBlocks(cvText)) {
    switch (b.kind) {
      case 'name':
        write({ bold: b.text, text: '' }, 18, { after: 2 });
        break;
      case 'contact':
        write({ text: b.text }, 10, { after: 1, grey: 70 });
        break;
      case 'heading':
        y += 12;
        ensure(48); // keep a heading with its first line
        write({ bold: b.text, text: '' }, 11.5, { after: 0 });
        pdf.setDrawColor(150);
        pdf.setLineWidth(0.6);
        pdf.line(margin, y + 1, margin + width, y + 1);
        y += 8;
        break;
      case 'entry':
        y += 8;
        ensure(48); // keep a job title with its dates and first bullet
        write(b.rich, 11, { after: 0 });
        break;
      case 'dates':
        write({ text: b.text }, 10, { italic: true, grey: 90, after: 3 });
        break;
      case 'bullet':
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10.5);
        ensure(14);
        pdf.text(pdfSafe('•'), margin + 4, y + 10.5);
        write(b.rich, 10.5, { indent: 16, after: 2 });
        break;
      default:
        write(b.rich, 10.5, { after: 3 });
    }
  }

  save(pdf.output('blob'), originalFileName, 'pdf');
}
