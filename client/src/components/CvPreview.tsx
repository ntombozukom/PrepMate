import { toBlocks, type Rich } from '../lib/cvExport';

/** The rewritten CV laid out as the Word and PDF files will be, so it can be checked before downloading. */
export function CvPreview({ cvText }: { cvText: string }) {
  const rich = (r: Rich) => <>{r.bold && <strong className="font-semibold text-slate-900">{r.bold}</strong>}{r.text}</>;

  return (
    <div className="bg-slate-100 p-3 sm:p-6 max-h-[44rem] overflow-y-auto">
      <article
        aria-label="Preview of your CV"
        className="mx-auto max-w-[44rem] bg-white px-6 py-8 sm:px-12 sm:py-12 text-[13px] leading-relaxed text-slate-800 shadow-sm font-[Arial,Helvetica,sans-serif]"
      >
        {toBlocks(cvText).map((b, i) => {
          switch (b.kind) {
            case 'name':
              return <h3 key={i} className="font-[inherit] text-2xl font-bold text-slate-900">{b.text}</h3>;
            case 'contact':
              return <p key={i} className="text-xs text-slate-600">{b.text}</p>;
            case 'heading':
              return (
                <h4 key={i} className="font-[inherit] mt-6 mb-2 border-b border-slate-300 pb-1 text-sm font-bold tracking-wide text-slate-900">
                  {b.text}
                </h4>
              );
            case 'entry':
              return <p key={i} className="mt-3.5 font-bold text-slate-900">{rich(b.rich)}</p>;
            case 'dates':
              return <p key={i} className="mb-1 text-xs italic text-slate-500">{b.text}</p>;
            case 'bullet':
              return (
                <p key={i} className="flex gap-2 pl-1">
                  <span aria-hidden="true">•</span>
                  <span>{rich(b.rich)}</span>
                </p>
              );
            default:
              return <p key={i} className="mb-1">{rich(b.rich)}</p>;
          }
        })}
      </article>
    </div>
  );
}
