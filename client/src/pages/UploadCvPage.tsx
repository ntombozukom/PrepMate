import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cvApi, getApiErrorMessage } from '../services/api';
import { Button } from '../components/ui/Button';
import { Upload, FileText, ArrowLeft } from 'lucide-react';

export default function UploadCvPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: cvApi.upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cv'] });
      navigate('/dashboard');
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
    else setError('Only PDF files are accepted.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 lg:px-10">
      <div className="w-full max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-2xl bg-white border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Upload your CV</h1>
          <p className="text-sm text-gray-500 mb-6">
            Upload once — we store it so you never have to re-upload. PDF only, max 5 MB.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10 text-blue-500" />
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">Drag & drop or click to select</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setError(''); setFile(f); }
            }}
          />

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!file}
            loading={isPending}
            onClick={() => file && mutate(file)}
          >
            Upload CV
          </Button>
        </div>
      </div>
    </div>
  );
}
