export interface Question {
  id: string;
  text: string;
  options: string[];
  answer: number;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  username: string;
  password: string;
  examAllowed: boolean;
  status: 'idle' | 'active' | 'suspended' | 'paused' | 'completed' | 'force_submitted' | string;
  violationCount: number;
  lastViolationReason: string;
  session?: string; // 'Sesi 1' | 'Sesi 2' | 'Sesi 3'
  savedAnswers?: Record<number, number>;
  savedDoubtful?: Record<number, boolean>;
  savedTimeLeft?: number;
  currentQuestionIdx?: number;
  lastActiveAt?: string;
  unlockedAfterSuspension?: boolean;
}

export interface QuestionPackage {
  id: string;
  title: string;
  subject: string;
  targetClass: string;
  description?: string;
  questions: Question[];
  createdAt?: string;
}

export interface ExamPackage {
  id: string;
  title: string;
  questionPackageId: string;
  targetClass: string;
  targetSession?: string; // 'ALL' | 'Sesi 1' | 'Sesi 2' | 'Sesi 3'
  selectedStudentIds?: string[];
  token: string;
  durationMinutes: number;
  isActive: boolean;
  subjectName?: string;
  questions?: Question[];
  createdAt?: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  username: string;
  session?: string;
  answers: Record<number, number>;
  correct: number;
  wrong: number;
  score: number;
  submittedAt: string;
  isForced?: boolean;
  subjectName?: string;
  examTitle?: string;
}

export interface ExamConfig {
  examToken: string;
  unlockPin: string;
  isExamActiveGlobal: boolean;
  activeSession?: string;
  sessionSchedule?: {
    session1: string;
    session2: string;
    session3: string;
    breakDuration: string;
  };
}

export type StaffRole = 'admin' | 'guru' | 'pengawas';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: StaffRole;
  subject?: string;
  createdAt?: string;
}
