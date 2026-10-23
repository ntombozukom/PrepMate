/**
 * Pulls the text out of a CV in the browser, so the file itself never leaves the visitor's device.
 * Mirrors the server-side readers (PdfPig and DocxExtractorService): one line per paragraph or PDF line.
 * The PDF and zip libraries are loaded only when a file is picked, to keep the landing page light.
 */

export const MAX_CV_BYTES = 5 * 1024 * 1024;

export class CvFileError extends Error {}

export async function extractCvText(file: File): Promise<string> {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (ext !== '.pdf' && ext !== '.docx')
    throw new CvFileError('Please upload a PDF or Word (.docx) file. Older .doc files can be saved as .docx in Word.');
  if (file.size > MAX_CV_BYTES) throw new CvFileError('File size must not exceed 5 MB.');

  let text: string;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    text = ext === '.docx' ? await docxText(bytes) : await pdfText(bytes);
  } catch {
    throw new CvFileError('We could not open this file. Please check it is a valid PDF or Word document.');
  }

  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 50)
    throw new CvFileError('We could not find any text in this file. If it is a scan or photo, please upload the original Word or PDF version.');
  return text;
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: bytes });
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent();
    let page = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      page += item.str;
      if (item.hasEOL) page += '\n';
      else if (item.str && !item.str.endsWith(' ')) page += ' ';
    }
    pages.push(page);
  }
  await task.destroy();
  return pages.join('\n');
}

async function docxText(bytes: Uint8Array): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate');
  const files = unzipSync(bytes, { filter: (f) => f.name === 'word/document.xml' });
  const xml = files['word/document.xml'];
  if (!xml) throw new Error('Not a Word document');

  const doc = new DOMParser().parseFromString(strFromU8(xml), 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const lines: string[] = [];
  for (const p of Array.from(doc.getElementsByTagNameNS(W, 'p'))) {
    let line = '';
    // Walk the paragraph in document order, picking up text, tabs and line breaks.
    const walker = doc.createTreeWalker(p, NodeFilter.SHOW_ELEMENT);
    for (let node = walker.nextNode() as Element | null; node; node = walker.nextNode() as Element | null) {
      if (node.namespaceURI !== W) continue;
      if (node.localName === 't') line += node.textContent ?? '';
      else if (node.localName === 'tab') line += '\t';
      else if (node.localName === 'br' || node.localName === 'cr') line += '\n';
    }
    lines.push(line);
  }
  return lines.join('\n');
}
