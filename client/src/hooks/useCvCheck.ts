import { useRef, useState } from 'react';
import { atsApi, getApiErrorMessage } from '../services/api';
import { CvFileError, extractCvText } from '../lib/cvText';
import { useTurnstile } from '../lib/turnstile';
import type { AtsScoreDto } from '../types/api';

export interface CheckedCv {
  /** Changes for each new file, so results from the last CV are cleared. */
  key: string;
  fileName: string;
  text: string;
}

export type CheckStage = 'idle' | 'reading' | 'checking' | 'done' | 'failed';

/**
 * The no-account check on the landing page: read the file in the browser, run the bot check,
 * then get the quick score. The rewrite and cover letter are asked for from the results.
 */
export function useCvCheck() {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const getToken = useTurnstile(turnstileRef);

  const [stage, setStage] = useState<CheckStage>('idle');
  const [cv, setCv] = useState<CheckedCv | null>(null);
  const [score, setScore] = useState<AtsScoreDto | null>(null);
  const [error, setError] = useState('');

  const runScore = async (picked: CheckedCv) => {
    setStage('checking');
    setError('');
    try {
      const token = await getToken().catch(() => {
        throw new Error("We couldn't confirm you're a person. Please refresh the page and try again.");
      });
      setScore(await atsApi.score(picked.text, token));
      setStage('done');
    } catch (e) {
      setError(e instanceof Error && !('isAxiosError' in e) ? e.message : getApiErrorMessage(e));
      setStage('failed');
    }
  };

  const pick = async (file: File) => {
    setStage('reading');
    setError('');
    setScore(null);
    try {
      const text = await extractCvText(file);
      const picked = { key: `${file.name}-${file.lastModified}-${file.size}`, fileName: file.name, text };
      setCv(picked);
      await runScore(picked);
    } catch (e) {
      setCv(null);
      setError(e instanceof CvFileError ? e.message : 'We could not open this file. Please check it is a valid PDF or Word document.');
      setStage('failed');
    }
  };

  const retry = () => { if (cv) void runScore(cv); };

  // The ref is kept apart from the state so components can read the state during render.
  return { turnstileRef, check: { stage, cv, score, error, pick, retry } };
}
