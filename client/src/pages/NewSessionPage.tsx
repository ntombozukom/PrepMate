import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cvApi, prepSessionApi, jdApi, getApiErrorMessage } from '../services/api';
import { Industry, IndustryLabels } from '../types/api';
import {
  ArrowLeft, Sparkles, ClipboardPaste, UploadCloud, X, FileText, Briefcase, Building2,
} from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';

type JdMode = 'paste' | 'upload';

const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';

export default function NewSessionPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    jobTitle: '',
    companyName: '',
    industry: Industry.Fintech as Industry,
    jobDescriptionText: '',
  });
  const [jdMode, setJdMode] = useState<JdMode>('paste');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const { data: activeCv } = useQuery({
    queryKey: ['cv', 'active'],
    queryFn: cvApi.getActive,
    retry: false,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: prepSessionApi.create,
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['prep-sessions'] });
      navigate(`/sessions/${session.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleFileUpload = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.name.toLowerCase().endsWith('.txt');
    if (!isPdf && !isTxt) {
      setError('Please upload a PDF or TXT file.');
      return;
    }
    setError('');
    setUploadedFileName(file.name);
    if (isPdf) {
      setExtracting(true);
      try {
        const text = await jdApi.extractText(file);
        setForm((f) => ({ ...f, jobDescriptionText: text }));
      } catch {
        setError('Could not extract text from the PDF. Try copy-pasting instead.');
        setUploadedFileName('');
      } finally {
        setExtracting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm((f) => ({ ...f, jobDescriptionText: e.target?.result as string }));
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const clearUpload = () => {
    setUploadedFileName('');
    setForm((f) => ({ ...f, jobDescriptionText: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCv) return;
    setError('');
    mutate({
      cvDocumentId: activeCv.id,
      jobTitle: form.jobTitle,
      companyName: form.companyName || undefined,
      industry: form.industry,
      jobDescriptionText: form.jobDescriptionText,
    });
  };

  const charCount = form.jobDescriptionText.length;
  const charOk = charCount >= 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-4 py-8">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Prep Session</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI will explain every key concept in plain language — tailored to your CV and industry.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <X className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {!activeCv && (
          <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Upload your CV first —{' '}
            <button onClick={() => navigate('/cv/upload')} className="underline font-semibold">
              do it here
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Job Title + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Job Title <span className="text-indigo-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  required
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  className={`${inputCls} pl-10`}
                  placeholder="e.g. Senior .NET Engineer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Company <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className={`${inputCls} pl-10`}
                  placeholder="e.g. Acme Bank"
                />
              </div>
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Industry <span className="text-indigo-500">*</span>
            </label>
            <select
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: Number(e.target.value) as Industry }))}
              className={inputCls}
            >
              {Object.entries(IndustryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Tailors every explanation with real-world context from your sector.
            </p>
          </div>

          {/* JD — paste or upload toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Job Description <span className="text-indigo-500">*</span>
              </label>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => { setJdMode('paste'); clearUpload(); }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    jdMode === 'paste'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setJdMode('upload')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    jdMode === 'upload'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Upload
                </button>
              </div>
            </div>

            {jdMode === 'paste' ? (
              <>
                <textarea
                  required
                  minLength={100}
                  value={form.jobDescriptionText}
                  onChange={(e) => setForm((f) => ({ ...f, jobDescriptionText: e.target.value }))}
                  rows={12}
                  className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
                  placeholder="Paste the full job description here..."
                />
                <p className={`mt-1.5 text-xs ${charOk ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {charCount} chars{!charOk && ` (${100 - charCount} more needed)`}
                </p>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
                {extracting ? (
                  <div className="flex items-center justify-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-6 text-sm text-indigo-700">
                    <Spinner size="sm" />
                    Extracting text from PDF...
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{uploadedFileName}</span>
                      {charOk && <span className="text-xs text-emerald-600">· {charCount} chars extracted</span>}
                    </div>
                    <button type="button" onClick={clearUpload} className="text-emerald-500 hover:text-emerald-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                  >
                    <UploadCloud className="h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Drop your JD file here</p>
                    <p className="text-xs text-gray-400">or click to browse · PDF or TXT</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!activeCv || isPending || extracting || !charOk}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5"
          >
            {isPending ? (
              <>
                <Spinner size="sm" className="text-white" />
                Generating concepts...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate prep concepts
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
