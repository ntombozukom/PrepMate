export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface CvDocumentDto {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  isActive: boolean;
  uploadedAt: string;
}

export enum Industry {
  Fintech = 1,
  Banking = 2,
  Healthcare = 3,
  ECommerce = 4,
  Insurance = 5,
  Telecommunications = 6,
  Retail = 7,
  Logistics = 8,
  Education = 9,
  GeneralSoftware = 10,
}

export const IndustryLabels: Record<Industry, string> = {
  [Industry.Fintech]: 'Fintech',
  [Industry.Banking]: 'Banking',
  [Industry.Healthcare]: 'Healthcare',
  [Industry.ECommerce]: 'E-Commerce',
  [Industry.Insurance]: 'Insurance',
  [Industry.Telecommunications]: 'Telecommunications',
  [Industry.Retail]: 'Retail',
  [Industry.Logistics]: 'Logistics',
  [Industry.Education]: 'Education',
  [Industry.GeneralSoftware]: 'General Software',
};

export enum DifficultyLevel {
  Fundamental = 1,
  Intermediate = 2,
  Advanced = 3,
  Expert = 4,
}

export const DifficultyColors: Record<string, string> = {
  Fundamental: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-orange-100 text-orange-800',
  Expert: 'bg-red-100 text-red-800',
};

export interface ConceptExplanationDto {
  id: string;
  topic: string;
  question: string;
  plainEnglishExplanation: string;
  analogy?: string;
  technicalDepth?: string;
  industryContext?: string;
  suggestedAnswer?: string;
  difficulty: DifficultyLevel;
  difficultyName: string;
  orderIndex: number;
}

export interface PrepSessionDto {
  id: string;
  jobTitle: string;
  companyName?: string;
  industry: Industry;
  industryName: string;
  createdAt: string;
  conceptCount: number;
}

export interface PrepSessionDetailDto {
  id: string;
  jobTitle: string;
  companyName?: string;
  industry: Industry;
  industryName: string;
  jobDescriptionText: string;
  createdAt: string;
  concepts: ConceptExplanationDto[];
}

export interface CreatePrepSessionRequest {
  cvDocumentId: string;
  jobDescriptionText: string;
  jobTitle: string;
  industry: Industry;
  companyName?: string;
}

export interface ApiError {
  title: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface JdAnalysisResult {
  jobTitle: string;
  companyName: string | null;
  industry: Industry;
}

// ─── CV Tools ─────────────────────────────────────────────────────────────────

export interface MatchedSkillDto {
  skill: string;
  strength: 'Strong' | 'Medium' | 'Weak';
  evidence: string;
}

export interface SkillGapDto {
  skill: string;
  importance: 'High' | 'Medium' | 'Low';
  tip: string;
}

export interface CvMatchResultDto {
  overallMatch: 'Strong' | 'Medium' | 'Weak';
  matchScore: number;
  matchedSkills: MatchedSkillDto[];
  skillGaps: SkillGapDto[];
  experienceAlignment: string;
  recommendation: string;
}

export interface CoverLetterDto {
  coverLetter: string;
  tone: string;
  /** No-account check only: figures in the letter that aren't in the CV or job ad. */
  unverifiedFigures?: string[];
}

export interface AtsOptimizationDto {
  score: number;
  strengths: string[];
  improvements: string[];
  rewrittenSummary: string;
  keywordsToAdd: string[];
  rewrittenCv: string;
  /** True when the CV was longer than the AI limit and only the first part was rewritten. */
  cvWasTruncated: boolean;
}

/** Quick ATS score from the no-account check. `pass` lets the same visitor ask for the rewrite and cover letter. */
export interface AtsScoreDto {
  score: number;
  strengths: string[];
  /** What to fix; `quote` is the exact line from the CV the point is about, when there is one. */
  issues: { text: string; quote?: string }[];
  cvWasTruncated: boolean;
  pass: string;
}

export interface AtsRewriteDto {
  rewrittenCv: string;
  changes: string[];
  keywordsAdded: string[];
  /** Figures in the rewrite that aren't in the original CV, for the visitor to check or remove. */
  unverifiedFigures: string[];
  cvWasTruncated: boolean;
}

export interface FeaturesDto {
  /** Interview prep (sessions, concepts, match analysis). Off = shown as coming soon. */
  jobPrep: boolean;
  /** Sign-up, sign-in and saved CVs. Off = the no-account check at /check only. */
  accounts: boolean;
}

export interface WaitlistStatusDto {
  joined: boolean;
  joinedAt: string | null;
}
