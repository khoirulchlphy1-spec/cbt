import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, Clock, CheckCircle, AlertCircle, FileText, 
  LogOut, Send, Printer, LayoutDashboard, ChevronRight, ChevronLeft, Lock, Eye, X,
  Key, Plus, ShieldCheck, Power, Search, UserX, UserPlus,
  ShieldAlert, AlertTriangle, RefreshCw, Unlock, Shield, GraduationCap,
  Edit, Trash2, Download, Bookmark, FileSpreadsheet, Check, RotateCcw,
  Radio, Activity, Play, Zap, Hourglass, Wifi, Filter, ArrowUpDown,
  Layers, BookOpen, Copy, Cloud
} from 'lucide-react';

import { 
  auth, db, appId, 
  signInAnonymously, signInWithCustomToken, onAuthStateChanged,
  collection, addDoc, setDoc, deleteDoc, doc, onSnapshot 
} from './firebase';

import { Question, Student, Submission, QuestionPackage, ExamPackage, StaffUser, StaffRole } from './types';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { INITIAL_STUDENTS } from './data/initialStudents';
import { INITIAL_QUESTION_PACKAGES, INITIAL_EXAM_PACKAGES } from './data/defaultPackages';
import { INITIAL_STAFF_USERS } from './data/defaultStaffUsers';
import { DEFAULT_SUBJECTS } from './data/defaultSubjects';
import { downloadPdfFile } from './utils/pdf';
import { downloadStudentTemplate } from './utils/studentTemplate';

import { FormattedContent } from './components/FormattedContent';
import { StudentExamView } from './components/StudentExamView';
import { StudentCardModal } from './components/StudentCardModal';
import { ImportModal } from './components/ImportModal';
import { QuestionModal } from './components/QuestionModal';
import { EditStudentModal } from './components/EditStudentModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { QuestionPackageModal } from './components/QuestionPackageModal';
import { ExamPackageModal } from './components/ExamPackageModal';
import { ExamArchiveView } from './components/ExamArchiveView';
import { StaffManagementView } from './components/StaffManagementView';
import { SubjectManagementModal } from './components/SubjectManagementModal';
import { CloudflareD1View } from './components/CloudflareD1View';
import { syncApi } from './services/apiSync';

const TOTAL_TIME_SECONDS = 70 * 60; // 70 Minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(isoString?: string) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('selection');
  
  // Student Auth & Session
  const [loginInput, setLoginInput] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggedStudent, setLoggedStudent] = useState<Student | null>(null);
  const loggedStudentRef = useRef<Student | null>(loggedStudent);

  useEffect(() => {
    loggedStudentRef.current = loggedStudent;
  }, [loggedStudent]);

  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  const enterFullscreen = () => {
    try {
      const docEl = document.documentElement as any;
      const docAny = document as any;
      const isFS = Boolean(
        document.fullscreenElement || 
        docAny.webkitFullscreenElement || 
        docAny.mozFullScreenElement || 
        docAny.msFullscreenElement
      );
      if (!isFS) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen().catch(() => {});
        } else if (docEl.webkitEnterFullscreen) {
          docEl.webkitEnterFullscreen().catch(() => {});
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen().catch(() => {});
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen().catch(() => {});
        }
      }
      window.scrollTo(0, 0);
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }
  };

  // Anti-Cheat State
  const [suspensionReason, setSuspensionReason] = useState('');
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [isFullScreenActive, setIsFullScreenActive] = useState<boolean>(true);
  const [isScreenBlinded, setIsScreenBlinded] = useState<boolean>(false);
  const lastViolationTimeRef = useRef<number>(0);

  // Local Teacher Unlock Modal state
  const [showTeacherPinModal, setShowTeacherPinModal] = useState(false);
  const [teacherPinInput, setTeacherPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Exam State
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [doubtfulAnswers, setDoubtfulAnswers] = useState<Record<number, boolean>>({});
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const doubtfulAnswersRef = useRef(doubtfulAnswers);
  useEffect(() => { doubtfulAnswersRef.current = doubtfulAnswers; }, [doubtfulAnswers]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const currentQuestionIdxRef = useRef(currentQuestionIdx);
  useEffect(() => { currentQuestionIdxRef.current = currentQuestionIdx; }, [currentQuestionIdx]);
  const [finalScore, setFinalScore] = useState<{ correctCount: number; wrongCount: number; score: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [forcedSubmitNotice, setForcedSubmitNotice] = useState(false);
  
  // Staff User Management & Auth State
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(INITIAL_STAFF_USERS);
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(INITIAL_STAFF_USERS[0]);
  const [staffLoginInput, setStaffLoginInput] = useState({ username: '', password: '' });
  const [teacherPassword, setTeacherPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [viewingDetail, setViewingDetail] = useState<Submission | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [teacherTab, setTeacherTab] = useState<'submissions' | 'students' | 'paket_ujian' | 'bank_soal' | 'violations' | 'controls' | 'staff_users' | 'subjects' | 'cloudflare'>('submissions');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevStudentsMapRef = useRef<Record<string, Student>>({});

  // Master Data Mata Pelajaran (Subjects)
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newSubjectError, setNewSubjectError] = useState('');

  // Question Packages & Exam Packages State
  const [questionPackages, setQuestionPackages] = useState<QuestionPackage[]>(INITIAL_QUESTION_PACKAGES);
  const [examPackages, setExamPackages] = useState<ExamPackage[]>(INITIAL_EXAM_PACKAGES);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(INITIAL_QUESTION_PACKAGES[0]?.id || 'pkg-tiu-1');
  const [activeExamPackage, setActiveExamPackage] = useState<ExamPackage | null>(null);

  // Modals for Packages
  const [showQuestionPackageModal, setShowQuestionPackageModal] = useState(false);
  const [editingQuestionPackage, setEditingQuestionPackage] = useState<QuestionPackage | null>(null);
  const [showExamPackageModal, setShowExamPackageModal] = useState(false);
  const [editingExamPackage, setEditingExamPackage] = useState<ExamPackage | null>(null);

  // Student DB & Config State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [examToken, setExamToken] = useState('FISIKA2026');
  const [unlockPin, setUnlockPin] = useState('00000');
  const [isExamActiveGlobal, setIsExamActiveGlobal] = useState(true);
  const [activeSession, setActiveSession] = useState<string>('ALL'); // Keep for backward safety

  // Student Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSessionFilter, setStudentSessionFilter] = useState('ALL');
  const [studentGradeFilter, setStudentGradeFilter] = useState('ALL'); // 'ALL' | 'X' | 'XI' | 'XII'
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentSortBy, setStudentSortBy] = useState<'class_asc' | 'name_asc' | 'name_desc' | 'status'>('class_asc');
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentPerPage, setStudentPerPage] = useState<number>(50);

  // Submission Filters
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionSessionFilter, setSubmissionSessionFilter] = useState('ALL');
  const [submissionGradeFilter, setSubmissionGradeFilter] = useState('ALL');
  const [submissionClassFilter, setSubmissionClassFilter] = useState('ALL');
  const [submissionSortBy, setSubmissionSortBy] = useState<'time_desc' | 'name_asc' | 'name_desc' | 'class_asc' | 'score_desc' | 'score_asc'>('time_desc');

  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [showStudentCardModal, setShowStudentCardModal] = useState(false);
  
  // Modals & Action Confirmation State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentError, setEditStudentError] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', class: '', username: '', password: '' });
  const [addStudentError, setAddStudentError] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Student | 'bulk' | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<Student[]>([]);

  // Question Modal Form
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [questionFormData, setQuestionFormData] = useState<{
    id: string | null;
    text: string;
    options: string[];
    answer: number;
  }>({
    id: null,
    text: '',
    options: ['', '', '', '', ''],
    answer: 0
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadPdf = (elementId: string, filename: string) => {
    downloadPdfFile(elementId, filename, (isGenerating, msg) => {
      setIsGeneratingPDF(isGenerating);
      if (msg) showToast(msg);
    });
  };

  const handlePrintStudent = (sub: Submission) => {
    setViewingDetail(sub);
    setTimeout(() => {
      handleDownloadPdf('student-detail-content', `Hasil_Ujian_${sub.studentName.replace(/\s+/g, '_')}.pdf`);
    }, 400);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof (window as any).__initial_auth_token !== 'undefined' && (window as any).__initial_auth_token) {
          await signInWithCustomToken(auth, (window as any).__initial_auth_token);
        } else if (auth) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setUser({ uid: 'active-user' });
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || { uid: 'active-user' });
    });
    return () => unsubscribe();
  }, []);

  const processIncomingStudents = (data: Student[]) => {
    data.forEach(std => {
      const prev = prevStudentsMapRef.current[std.id];
      if (prev) {
        if ((std.violationCount || 0) > (prev.violationCount || 0)) {
          showToast(`🚨 PERINGATAN REALTIME: ${std.name} (${std.class}) - ${std.lastViolationReason || 'Pelanggaran baru!'}`);
        }
      }
      prevStudentsMapRef.current[std.id] = std;
    });

    setStudents(data);

    if (loggedStudentRef.current) {
      const updatedSelf = data.find(s => s.id === loggedStudentRef.current?.id);
      if (updatedSelf) {
        setLoggedStudent(updatedSelf);
      }
    }
  };

  // HTTP & SSE Realtime Sync Effect (Works across all devices/browsers)
  useEffect(() => {
    const applySyncPayload = (data: any) => {
      if (!data) return;
      if (Array.isArray(data.students)) {
        processIncomingStudents(data.students);
      }
      if (Array.isArray(data.submissions)) {
        const subs = [...data.submissions];
        subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setSubmissions(subs);
      }
      if (Array.isArray(data.questionPackages)) {
        setQuestionPackages(data.questionPackages);
      }
      if (Array.isArray(data.examPackages)) {
        setExamPackages(data.examPackages);
      }
      if (Array.isArray(data.questions)) {
        const qs = [...data.questions];
        qs.sort((a, b) => {
          const numA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
          const numB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        setQuestions(qs);
      }
      if (Array.isArray(data.staffUsers)) {
        setStaffUsers(data.staffUsers);
      }
      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        setSubjects(data.subjects);
      }
      if (data.config) {
        if (data.config.examToken) setExamToken(data.config.examToken);
        if (data.config.unlockPin) setUnlockPin(data.config.unlockPin);
        if (typeof data.config.isExamActiveGlobal === 'boolean') setIsExamActiveGlobal(data.config.isExamActiveGlobal);
        if (data.config.activeSession) setActiveSession(data.config.activeSession);
      }
    };

    // Initial sync
    syncApi.getSyncData().then(applySyncPayload);

    // EventSource (SSE) for instant pushes
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'INIT') {
            applySyncPayload(msg.payload);
          } else if (msg.type === 'STUDENTS_UPDATED') {
            processIncomingStudents(msg.payload);
          } else if (msg.type === 'STAFF_USERS_UPDATED') {
            if (Array.isArray(msg.payload)) setStaffUsers(msg.payload);
          } else if (msg.type === 'SUBJECTS_UPDATED') {
            if (Array.isArray(msg.payload)) setSubjects(msg.payload);
          } else if (msg.type === 'SUBMISSIONS_UPDATED') {
            const subs = [...msg.payload];
            subs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setSubmissions(subs);
          } else if (msg.type === 'QUESTION_PACKAGES_UPDATED') {
            if (Array.isArray(msg.payload)) setQuestionPackages(msg.payload);
          } else if (msg.type === 'EXAM_PACKAGES_UPDATED') {
            if (Array.isArray(msg.payload)) setExamPackages(msg.payload);
          } else if (msg.type === 'QUESTIONS_UPDATED') {
            const qs = [...msg.payload];
            qs.sort((a, b) => {
              const numA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
              const numB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
              return numA - numB;
            });
            setQuestions(qs);
          } else if (msg.type === 'CONFIG_UPDATED') {
            if (msg.payload.examToken) setExamToken(msg.payload.examToken);
            if (msg.payload.unlockPin) setUnlockPin(msg.payload.unlockPin);
            if (typeof msg.payload.isExamActiveGlobal === 'boolean') setIsExamActiveGlobal(msg.payload.isExamActiveGlobal);
            if (msg.payload.activeSession) setActiveSession(msg.payload.activeSession);
          }
        } catch (err) {
          console.error("SSE msg parse error:", err);
        }
      };
    } catch (e) {
      console.warn("EventSource setup failed:", e);
    }

    // Intelligent polling fallback: only poll if SSE is disconnected to prevent 700-client overload
    const interval = setInterval(() => {
      if (!es || es.readyState !== EventSource.OPEN) {
        syncApi.getSyncData().then(applySyncPayload);
      }
    }, 10000);

    return () => {
      if (es) es.close();
      clearInterval(interval);
    };
  }, []);

  // Firebase Firestore listener dimatikan sepenuhnya.
  // Seluruh sinkronisasi data dilakukan secara otomatis melalui Cloudflare D1 & Edge REST/SSE.

  // Real-time listener on student device for remote actions triggered by Teacher
  useEffect(() => {
    if (!loggedStudent) return;

    // 1. Check if Teacher/Admin/Pengawas unlocked student remotely
    const isUnlocked = loggedStudent.examAllowed && (loggedStudent.status === 'active' || loggedStudent.status === 'idle');
    if (isUnlocked && role === 'student_suspended') {
      lastViolationTimeRef.current = Date.now() + 2500;
      
      if (loggedStudent.savedAnswers && Object.keys(loggedStudent.savedAnswers).length > 0) {
        setAnswers(prev => ({ ...loggedStudent.savedAnswers, ...prev }));
      }
      if (loggedStudent.savedDoubtful) {
        setDoubtfulAnswers(prev => ({ ...loggedStudent.savedDoubtful, ...prev }));
      }
      if (typeof loggedStudent.savedTimeLeft === 'number') {
        setTimeLeft(loggedStudent.savedTimeLeft);
      }
      if (typeof loggedStudent.currentQuestionIdx === 'number') {
        setCurrentQuestionIdx(loggedStudent.currentQuestionIdx);
      }

      setIsScreenBlinded(false);
      setIsFullScreenActive(true);
      setViolationWarning(null);
      setSuspensionReason('');
      setRole('student_exam');
      showToast("🟢 Ujian dibuka kembali oleh Admin / Pengawas!");
    }

    // 2. Check if Teacher/Admin/Pengawas PAUSED student remotely
    if (loggedStudent.status === 'paused' && role === 'student_exam') {
      setRole('student_paused');
      showToast("⏸️ Ujian Anda dijeda sementara oleh Admin / Pengawas.");
    }

    // Check if Teacher/Admin/Pengawas RESUMED student after pause
    if (loggedStudent.status === 'active' && role === 'student_paused') {
      lastViolationTimeRef.current = Date.now() + 2500;
      setIsScreenBlinded(false);
      setIsFullScreenActive(true);
      setRole('student_exam');
      showToast("▶️ Ujian dilanjutkan kembali oleh Admin / Pengawas!");
    }

    // 3. Check if Teacher/Admin/Pengawas force stopped student remotely
    const isForceStopped = loggedStudent.status === 'force_submitted' || (loggedStudent.status === 'completed' && loggedStudent.examAllowed === false);
    if (isForceStopped && (role === 'student_exam' || role === 'student_suspended' || role === 'student_paused')) {
      handleFinishExam(true);
      showToast("⛔ Ujian Anda telah dihentikan oleh Admin / Pengawas.");
    }

    // 4. Check if Teacher reset student exam session remotely
    if (loggedStudent.status === 'idle' && (role === 'student_exam' || role === 'student_suspended' || role === 'student_paused' || role === 'student_result')) {
      setAnswers({});
      setDoubtfulAnswers({});
      setTimeLeft(TOTAL_TIME_SECONDS);
      setCurrentQuestionIdx(0);
      setRole('student_token');
      setViolationWarning(null);
      showToast("🔄 Sesi Ujian Anda telah direset oleh Admin.");
    }

    // 5. Check if Teacher added extra time
    if (role === 'student_exam' && typeof loggedStudent.savedTimeLeft === 'number') {
      const timeDiff = loggedStudent.savedTimeLeft - timeLeft;
      if (timeDiff > 15) {
        setTimeLeft(loggedStudent.savedTimeLeft);
        showToast(`⏰ Admin memberikan tambahan waktu +${Math.round(timeDiff / 60)} menit!`);
      }
    }
  }, [loggedStudent, role]);

  const resumeExamForStudent = (studentData?: Student) => {
    const dataToUse = studentData || loggedStudentRef.current || loggedStudent;
    if (!dataToUse) return;

    lastViolationTimeRef.current = Date.now() + 2500;
    
    let initialAnswers = dataToUse.savedAnswers || {};
    let initialDoubtful = dataToUse.savedDoubtful || {};
    try {
      const localAns = localStorage.getItem(`cbt_ans_${dataToUse.id}`);
      if (localAns) {
        initialAnswers = { ...JSON.parse(localAns), ...initialAnswers };
      }
      const localDoubt = localStorage.getItem(`cbt_doubt_${dataToUse.id}`);
      if (localDoubt) {
        initialDoubtful = { ...JSON.parse(localDoubt), ...initialDoubtful };
      }
    } catch (_) {}

    if (Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
    if (Object.keys(initialDoubtful).length > 0) {
      setDoubtfulAnswers(initialDoubtful);
    }
    if (dataToUse.savedTimeLeft) {
      setTimeLeft(dataToUse.savedTimeLeft);
    }

    enterFullscreen();
    setIsScreenBlinded(false);
    setIsFullScreenActive(true);
    setViolationWarning(null);
    setSuspensionReason('');
    setRole('student_exam');

    syncApi.updateStudent({
      id: dataToUse.id,
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', dataToUse.id), {
        status: 'active',
        lastActiveAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Resume exam sync error:", err));
    }
  };

  useEffect(() => {
    if (role !== 'student_exam') return;

    // 1. Screen Wake Lock API - Mencegah layar HP mati/redup saat ujian
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn("Screen Wake Lock failed:", err);
      }
    };
    requestWakeLock();

    // 2. Keyboard Lock API (Chromium/Android) - Mengunci shortcut sistem Alt+Tab/Meta/Esc
    if ('keyboard' in navigator && (navigator as any).keyboard?.lock) {
      try {
        (navigator as any).keyboard.lock(['Escape', 'AltGraph', 'AltLeft', 'AltRight', 'Tab', 'MetaLeft', 'MetaRight', 'F11', 'F12']);
      } catch (err) {
        console.warn("Keyboard Lock failed:", err);
      }
    }

    // Mati & batalkan sejenis Speech Synthesis / Voice Input aktif saat ujian dimulai
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          stream.getTracks().forEach(track => track.stop());
        }).catch(() => {});
      } catch (_) {}
    }

    const triggerSuspension = async (reason: string) => {
      const now = Date.now();
      if (now < lastViolationTimeRef.current) return;
      lastViolationTimeRef.current = now + 3000;

      const timestamp = new Date().toLocaleTimeString('id-ID');
      const fullReason = `${reason} (${timestamp})`;
      setSuspensionReason(fullReason);

      const currentStudent = loggedStudentRef.current || loggedStudent;
      if (!currentStudent) return;

      const currentCount = currentStudent.violationCount || 0;
      const newCount = currentCount + 1;
      const isAlreadyUnlockedAfterSuspension = currentStudent.unlockedAfterSuspension === true || (currentCount >= 5 && currentStudent.status === 'active');

      // KETENTUAN 4: Jika setelah buka kunci melakukan pelanggaran lagi, tetap diberikan peringatan tapi layar TIDAK terkunci
      if (isAlreadyUnlockedAfterSuspension) {
        setIsScreenBlinded(false);

        const updatedStudentData: Student = {
          ...currentStudent,
          violationCount: newCount,
          lastViolationReason: fullReason,
          unlockedAfterSuspension: true,
          status: 'active',
          examAllowed: true,
          lastActiveAt: new Date().toISOString()
        };

        setLoggedStudent(updatedStudentData);
        setStudents(prev => prev.map(s => s.id === currentStudent.id ? updatedStudentData : s));
        syncApi.updateStudent(updatedStudentData);

        if (db) {
          try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', currentStudent.id), updatedStudentData, { merge: true });
          } catch (err) {
            console.error("Error saving violation post-unlock:", err);
          }
        }

        setViolationWarning(`⚠️ Peringatan: Terdeteksi ${reason}! (Total Pelanggaran: ${newCount}x). Tetap fokus pada soal ujian.`);
        setTimeout(() => setViolationWarning(null), 6000);
        return;
      }

      // KETENTUAN 1: Pelanggaran 1 sampai 4 kali HANYA muncul notif atau peringatan saja (layar tidak terkunci)
      if (newCount < 5) {
        setIsScreenBlinded(false);

        const updatedStudentData: Student = {
          ...currentStudent,
          violationCount: newCount,
          lastViolationReason: fullReason,
          examAllowed: true,
          status: 'active',
          lastActiveAt: new Date().toISOString()
        };

        setLoggedStudent(updatedStudentData);
        setStudents(prev => prev.map(s => s.id === currentStudent.id ? updatedStudentData : s));
        syncApi.updateStudent(updatedStudentData);

        if (db) {
          try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', currentStudent.id), updatedStudentData, { merge: true });
          } catch (err) {
            console.error("Error saving violation 1-4:", err);
          }
        }

        const warnText = newCount === 4
          ? `⚠️ Peringatan (4/5): Terdeteksi ${reason}! PERINGATAN TERAKHIR sebelum layar terkunci pada pelanggaran ke-5.`
          : `⚠️ Peringatan (${newCount}/5): Terdeteksi ${reason}! Harap tetap berada di aplikasi ujian CBT.`;

        setViolationWarning(warnText);
        setTimeout(() => setViolationWarning(null), 6000);
        return;
      }

      // KETENTUAN 2: Ketika sudah sampai 5 kali, aplikasi atau layar terkunci sementara (bisa dibuka oleh Admin atau Pengawas)
      // KETENTUAN 5: Meski melakukan pelanggaran jawaban TIDAK terkirim otomatis
      if (newCount >= 5) {
        setIsScreenBlinded(false);
        setRole('student_suspended');

        const updatedStudentData: Student = {
          ...currentStudent,
          examAllowed: false,
          status: 'suspended',
          violationCount: newCount,
          lastViolationReason: fullReason,
          savedAnswers: answersRef.current || answers,
          savedDoubtful: doubtfulAnswersRef.current || doubtfulAnswers,
          savedTimeLeft: timeLeftRef.current || timeLeft,
          currentQuestionIdx: currentQuestionIdxRef.current || currentQuestionIdx,
          lastActiveAt: new Date().toISOString()
        };

        setLoggedStudent(updatedStudentData);
        setStudents(prev => prev.map(s => s.id === currentStudent.id ? updatedStudentData : s));
        syncApi.updateStudent(updatedStudentData);

        if (db) {
          try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', currentStudent.id), updatedStudentData, { merge: true });
          } catch (err) {
            console.error("Error saving violation 5:", err);
          }
        }
        return;
      }
    };

    // Deteksi Multitasking, Split Screen & Aplikasi Mengambang
    const checkMultitaskingAndFloatingApps = () => {
      if (document.pictureInPictureElement) {
        try { document.exitPictureInPicture(); } catch (_) {}
        triggerSuspension('Mode Picture-in-Picture / Aplikasi Mengambang Terdeteksi');
        return true;
      }

      if (!document.hasFocus() || document.hidden) {
        triggerSuspension('Fokus Layar Hilang (Terdeteksi Menu Asisten HP / Gemini Live / Aplikasi Mengambang)');
        return true;
      }

      return false;
    };

    // Matikan Web Speech Recognition API (Pengetikan Suara / Voice Input)
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      try {
        const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechClass && SpeechClass.prototype) {
          SpeechClass.prototype.start = function() {
            triggerSuspension('Terdeteksi Percobaan Voice Input / Speech Recognition');
          };
        }
      } catch (_) {}
    }

    // Monitor perubahan perangkat media / mikrofon
    if (navigator.mediaDevices) {
      try {
        navigator.mediaDevices.ondevicechange = () => {
          triggerSuspension('Perubahan Perangkat Media / Mikrofon Terdeteksi');
        };
      } catch (_) {}
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerSuspension('Pindah Tab / Home HP / Indikasi Screenshot');
      } else {
        requestWakeLock();
      }
    };

    const handleWindowBlur = () => {
      triggerSuspension('Hilang Fokus Layar (Interaksi Menu Asisten HP / Screenshot / Aplikasi Mengambang / Gemini Live)');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSuspension('Percobaan Tekan Lama / Menu Context');
    };

    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      triggerSuspension('Percobaan Salin (Copy) / Tempel (Paste) Teks');
    };

    // Larang total SELURUH input keyboard (fisik, virtual, maupun manual) & shortcut saat ujian berlangsung
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerSuspension(`Penggunaan Keyboard / Input Teks Dilarang Saat Ujian (${e.key || e.keyCode || 'Key'})`);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleInputEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target) {
        const inputType = (target as HTMLInputElement).type;
        if (inputType === 'checkbox' || inputType === 'radio' || target.getAttribute('type') === 'checkbox' || target.getAttribute('type') === 'radio') {
          return;
        }
      }
      e.preventDefault();
      e.stopPropagation();
      triggerSuspension('Terdeteksi Input Teks / Voice Typing / IME (Ditolak)');
    };

    const handleTouchCancel = (e: TouchEvent) => {
      // Intentionally empty: touchcancel happens naturally during browser native scroll / momentum scroll
    };

    const handlePointerCancel = (e: PointerEvent) => {
      // Intentionally empty: pointercancel happens naturally during browser native scroll
    };

    const handlePiPChange = () => {
      if (document.pictureInPictureElement) {
        try { document.exitPictureInPicture(); } catch (_) {}
        triggerSuspension('Mode Picture-in-Picture / Aplikasi Mengambang Terdeteksi');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Ignore mouseleave on touch screens (mobile/tablet) to prevent false violation flags while scrolling
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

      if (e.clientY <= 5 || e.clientX <= 5 || (e.clientX >= window.innerWidth - 5) || (e.clientY >= window.innerHeight - 5)) {
        triggerSuspension('Kursor Keluar Area Ujian');
      }
    };

    const handleFullscreenChange = () => {
      const isFS = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement);
      setIsFullScreenActive(isFS);
      if (!isFS) {
        triggerSuspension('Keluar Layar Penuh (Split Screen / Pop-up / Menu HP)');
      }
    };

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartedAtEdge = false;
    let touchEdgeType: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

    const handleTouchStart = (e: TouchEvent) => {
      // Block 2+ finger gestures (pinch zoom / screenshot / multi-finger swipes)
      if (e.touches.length >= 2) {
        if (e.cancelable) e.preventDefault();
        triggerSuspension('Gestur Multi-Sentuh 2+ Jari Terdeteksi (Dilarang Saat Ujian)');
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;

        // Expanded edge thresholds to instantly capture status bar, notification shade, and gesture bar swipes
        const topEdgeThreshold = Math.max(75, window.innerHeight * 0.12);
        const bottomEdgeThreshold = window.innerHeight - Math.max(50, window.innerHeight * 0.10);
        const leftEdgeThreshold = Math.max(35, window.innerWidth * 0.08);
        const rightEdgeThreshold = window.innerWidth - Math.max(35, window.innerWidth * 0.08);

        if (touch.clientY <= topEdgeThreshold || touch.pageY <= topEdgeThreshold) {
          touchStartedAtEdge = true;
          touchEdgeType = 'top';
        } else if (touch.clientY >= bottomEdgeThreshold || touch.pageY >= bottomEdgeThreshold) {
          touchStartedAtEdge = true;
          touchEdgeType = 'bottom';
        } else if (touch.clientX <= leftEdgeThreshold || touch.pageX <= leftEdgeThreshold) {
          touchStartedAtEdge = true;
          touchEdgeType = 'left';
        } else if (touch.clientX >= rightEdgeThreshold || touch.pageX >= rightEdgeThreshold) {
          touchStartedAtEdge = true;
          touchEdgeType = 'right';
        } else {
          touchStartedAtEdge = false;
          touchEdgeType = 'none';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartY;
        const deltaX = touch.clientX - touchStartX;

        // 1. Deteksi tarikan dari tepi layar (Status Bar, Notifikasi, Gestur Back, Floating Sidebar)
        if (touchStartedAtEdge) {
          if (touchEdgeType === 'top' && deltaY >= 5) {
            if (e.cancelable) e.preventDefault();
            triggerSuspension('Menarik Layar dari Tepi Atas (Membuka Menu Status Bar / Notifikasi HP)');
            return;
          } else if (touchEdgeType === 'bottom' && deltaY <= -5) {
            if (e.cancelable) e.preventDefault();
            triggerSuspension('Menarik Layar dari Tepi Bawah (Navigasi / Switch App HP)');
            return;
          } else if (touchEdgeType === 'left' && deltaX >= 5) {
            if (e.cancelable) e.preventDefault();
            triggerSuspension('Menarik Layar dari Tepi Kiri (Gestur Kembali / Sidebar Mengambang)');
            return;
          } else if (touchEdgeType === 'right' && deltaX <= -5) {
            if (e.cancelable) e.preventDefault();
            triggerSuspension('Menarik Layar dari Tepi Kanan (Gestur Kembali / Sidebar Mengambang)');
            return;
          }
        }

        // 2. Deteksi posisi koordinat jari yang masuk ke area batas tepi layar saat digeser
        if (touch.clientY <= 30 && deltaY >= 5) {
          if (e.cancelable) e.preventDefault();
          triggerSuspension('Menarik Menu Status Bar / Notifikasi Atas HP');
          return;
        }
        if (touch.clientY >= window.innerHeight - 25 && deltaY <= -5) {
          if (e.cancelable) e.preventDefault();
          triggerSuspension('Menarik Menu Navigasi Bawah HP');
          return;
        }
        if (touch.clientX <= 20 && deltaX >= 5) {
          if (e.cancelable) e.preventDefault();
          triggerSuspension('Menarik Menu Gestur Kiri HP');
          return;
        }
        if (touch.clientX >= window.innerWidth - 20 && deltaX <= -5) {
          if (e.cancelable) e.preventDefault();
          triggerSuspension('Menarik Menu Gestur Kanan / Sidebar HP');
          return;
        }

        // 3. Verifikasi gerakan sentuh hanya diizinkan di dalam area lembar soal (scroll soal)
        const target = e.target as HTMLElement;
        const isInsideScrollable = Boolean(target && target.closest('#cbt-question-scroll-area, [data-cbt-scroll="true"], button, label, input'));
        if (!isInsideScrollable && (Math.abs(deltaY) > 10 || Math.abs(deltaX) > 10)) {
          if (e.cancelable) e.preventDefault();
          triggerSuspension('Gerakan Sentuh di Luar Area Soal Ujian (Mencoba Navigasi / Gestur HP)');
          return;
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        const inputType = (target as HTMLInputElement).type;
        if (inputType === 'checkbox' || inputType === 'radio') {
          return;
        }
        target.blur();
        e.preventDefault();
        triggerSuspension('Terdeteksi Percobaan Mengetik / Keyboard Virtual / Voice Input');
      }
    };

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    const handleResize = () => {
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      const widthDiff = Math.abs(currentWidth - lastWidth);
      const heightDiff = Math.abs(currentHeight - lastHeight);
      
      // On mobile touch devices, scrolling up/down auto-hides/shows browser address bars changing window.innerHeight by ~60-100px.
      // Ignore pure height changes from browser chrome during normal scrolling on mobile.
      if (isTouchDevice) {
        if (widthDiff > 60 || (heightDiff > window.innerHeight * 0.35 && widthDiff > 20)) {
          triggerSuspension('Perubahan Ukuran Layar (Split Screen / Floating App)');
        }
      } else {
        if ((widthDiff > 80 || heightDiff > 80) && (lastWidth !== currentHeight && lastHeight !== currentWidth)) {
          triggerSuspension('Perubahan Ukuran Layar (Split Screen / Floating App / Keyboard)');
        }
      }
      lastWidth = currentWidth;
      lastHeight = currentHeight;
    };

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        const hRatio = window.visualViewport.height / window.innerHeight;
        // Detect floating app / split screen opening when height drops drastically
        if (hRatio < 0.70) {
          triggerSuspension('Split Screen / Floating App Terdeteksi');
        }
      }
    };

    const handleOrientationChange = () => {
      triggerSuspension('Perubahan Orientasi Layar HP / Putar Layar');
    };

    const handlePageHide = () => {
      triggerSuspension('Aplikasi Pindah ke Latar Belakang (Page Hide / Screenshot)');
    };

    const devToolsCheck = setInterval(() => {
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (isTouchDevice) return; // Skip devtools outer vs inner size check on mobile where address bar fluctuates

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        triggerSuspension('Membuka Inspector / DevTools Browser');
      }
    }, 2000);

    const focusCheck = setInterval(() => {
      if (role === 'student_exam') {
        checkMultitaskingAndFloatingApps();
      }
    }, 2000);

    // Otomatis paksa fullscreen jika siswa mengklik/mengetuk area ujian saat keluar fullscreen
    const handleGlobalClickToLock = () => {
      const docAny = document as any;
      const isFS = Boolean(
        document.fullscreenElement || 
        docAny.webkitFullscreenElement || 
        docAny.mozFullScreenElement || 
        docAny.msFullscreenElement
      );
      if (!isFS) {
        enterFullscreen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('selectstart', handleCopyPaste);
    document.addEventListener('dragstart', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('beforeinput', handleInputEvent, true);
    window.addEventListener('input', handleInputEvent, true);
    window.addEventListener('compositionstart', handleInputEvent, true);
    window.addEventListener('touchcancel', handleTouchCancel);
    window.addEventListener('pointercancel', handlePointerCancel);
    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('click', handleGlobalClickToLock);
    document.addEventListener('pointerdown', handleGlobalClickToLock);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
      clearInterval(devToolsCheck);
      clearInterval(focusCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('selectstart', handleCopyPaste);
      document.removeEventListener('dragstart', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('beforeinput', handleInputEvent, true);
      window.removeEventListener('input', handleInputEvent, true);
      window.removeEventListener('compositionstart', handleInputEvent, true);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('pointercancel', handlePointerCancel);
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('click', handleGlobalClickToLock);
      document.removeEventListener('pointerdown', handleGlobalClickToLock);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, [role, loggedStudent, answers, timeLeft, user]);

  useEffect(() => {
    let timer: any;
    if (role === 'student_exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [role, timeLeft]);

  const isExamEligibleForStudent = (exam: ExamPackage, student: Student | null): boolean => {
    if (!student || !exam || !exam.isActive) return false;

    // 1. If specific students are assigned:
    if (Array.isArray(exam.selectedStudentIds) && exam.selectedStudentIds.length > 0) {
      return exam.selectedStudentIds.includes(student.id);
    }

    // 2. Otherwise check targetClass
    if (!exam.targetClass) return true;

    const targetRaw = exam.targetClass.trim().toUpperCase();
    const studentClassRaw = (student.class || '').trim().toUpperCase();

    if (!studentClassRaw) return true;

    if (targetRaw === 'ALL' || targetRaw === 'SEMUA' || targetRaw === 'SEMUA KELAS' || targetRaw === 'ALL CLASSES') {
      return true;
    }

    const classList = targetRaw.split(',').map(c => c.trim()).filter(Boolean);
    if (classList.some(c => c === studentClassRaw || c.includes(studentClassRaw) || studentClassRaw.includes(c))) {
      return true;
    }

    return false;
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    enterFullscreen();
    setLoginError('');
    setViolationWarning(null);
    setSuspensionReason('');
    setIsScreenBlinded(false);
    setIsFullScreenActive(true);

    const cleanUser = loginInput.username.trim().toLowerCase();
    const cleanPass = loginInput.password.trim();

    const found = students.find(s => 
      (s.username.toLowerCase() === cleanUser || (s.id === 'std-391' && (cleanUser === '10539' || cleanUser === '10639'))) && 
      (s.password === cleanPass || (s.id === 'std-391' && (cleanPass === '10539' || cleanPass === '10639')))
    );

    if (!found) {
      setLoginError('Username atau Password salah! Periksa kembali data akun Anda.');
      return;
    }

    setLoggedStudent(found);
    setRole('student_token');
    setTokenError('');

    // Check eligible active exam packages for this student
    const eligible = examPackages.filter(e => isExamEligibleForStudent(e, found));
    if (eligible.length > 0) {
      setTokenInput(eligible[0].token);
    } else {
      setTokenInput('');
    }

    syncApi.updateStudent({ id: found.id, lastActiveAt: new Date().toISOString() });
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    enterFullscreen();
    setTokenError('');

    if (!isExamActiveGlobal) {
      setTokenError('Maaf, Ujian sedang ditutup sementara oleh Admin.');
      return;
    }

    const currentStudent = students.find(s => s.id === loggedStudent?.id) || loggedStudent;

    if (!currentStudent?.examAllowed) {
      setTokenError('Akun Anda belum diberi izin untuk mengikuti ujian. Hubungi Admin.');
      return;
    }

    const eligibleExams = examPackages.filter(e => isExamEligibleForStudent(e, currentStudent));

    if (eligibleExams.length === 0) {
      setTokenError(`Tidak ada paket ujian aktif yang ditugaskan untuk kelas (${currentStudent?.class || 'Anda'}) atau akun Anda saat ini.`);
      return;
    }

    const cleanToken = tokenInput.trim().toUpperCase();
    const matchedExam = examPackages.find(e => e.isActive && e.token.toUpperCase() === cleanToken);

    if (matchedExam) {
      const isEligible = isExamEligibleForStudent(matchedExam, currentStudent);
      if (!isEligible) {
        setTokenError(`Paket Ujian "${matchedExam.title}" ditujukan untuk kelas/siswa lain! Akun Anda (${currentStudent?.class || 'Anda'}) tidak terdaftar dalam paket ujian ini.`);
        return;
      }

      const matchedPkg = questionPackages.find(p => p.id === matchedExam.questionPackageId);
      if (matchedPkg && matchedPkg.questions && matchedPkg.questions.length > 0) {
        setQuestions(matchedPkg.questions);
      } else if (matchedExam.questions && matchedExam.questions.length > 0) {
        setQuestions(matchedExam.questions);
      }
      setActiveExamPackage(matchedExam);
      if (!currentStudent.savedTimeLeft) {
        setTimeLeft((matchedExam.durationMinutes || 70) * 60);
      }
    } else if (cleanToken === examToken.trim().toUpperCase()) {
      if (eligibleExams.length > 0) {
        setActiveExamPackage(eligibleExams[0]);
        const matchedPkg = questionPackages.find(p => p.id === eligibleExams[0].questionPackageId);
        if (matchedPkg && matchedPkg.questions) {
          setQuestions(matchedPkg.questions);
        }
        if (!currentStudent.savedTimeLeft) {
          setTimeLeft((eligibleExams[0].durationMinutes || 70) * 60);
        }
      } else {
        setActiveExamPackage(null);
      }
    } else {
      setTokenError('Token Ujian salah! Silakan periksa kembali token resmi dari Admin.');
      return;
    }

    if (currentStudent.status === 'suspended') {
      setRole('student_suspended');
      setLoggedStudent(currentStudent);
      return;
    }

    const updatedStudent: Student = {
      ...currentStudent,
      status: 'active'
    };
    setLoggedStudent(updatedStudent);
    syncApi.updateStudent({ id: currentStudent.id, status: 'active', lastActiveAt: new Date().toISOString() });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', currentStudent.id), {
          status: 'active',
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error updating status to active:", err);
      }
    }

    let initialAnswers = currentStudent.savedAnswers || {};
    let initialDoubtful = currentStudent.savedDoubtful || {};
    try {
      const localAns = localStorage.getItem(`cbt_ans_${currentStudent.id}`);
      if (localAns) {
        initialAnswers = { ...JSON.parse(localAns), ...initialAnswers };
      }
      const localDoubt = localStorage.getItem(`cbt_doubt_${currentStudent.id}`);
      if (localDoubt) {
        initialDoubtful = { ...JSON.parse(localDoubt), ...initialDoubtful };
      }
    } catch (_) {}

    if (Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
    if (Object.keys(initialDoubtful).length > 0) {
      setDoubtfulAnswers(initialDoubtful);
    }
    if (currentStudent.savedTimeLeft) {
      setTimeLeft(currentStudent.savedTimeLeft);
    }

    lastViolationTimeRef.current = Date.now() + 2500;
    setIsScreenBlinded(false);
    setIsFullScreenActive(true);
    setViolationWarning(null);
    setSuspensionReason('');
    
    enterFullscreen();
    setRole('student_exam');
  };

  // Heartbeat interval to sync active timer and student activity to Firestore every 4 seconds
  useEffect(() => {
    if (role !== 'student_exam' || !loggedStudentRef.current) return;
    const interval = setInterval(() => {
      if (loggedStudentRef.current) {
        syncApi.updateStudent({
          id: loggedStudentRef.current.id,
          savedTimeLeft: timeLeftRef.current,
          currentQuestionIdx: currentQuestionIdxRef.current,
          lastActiveAt: new Date().toISOString(),
          status: 'active'
        });
      }
      if (db && loggedStudentRef.current) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', loggedStudentRef.current.id), {
          savedTimeLeft: timeLeftRef.current,
          currentQuestionIdx: currentQuestionIdxRef.current,
          lastActiveAt: new Date().toISOString(),
          status: 'active'
        }, { merge: true }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [role, loggedStudent?.id]);

  const handleAnswerSelect = (qIdx: number, optionIdx: number) => {
    const updated = { ...answers, [qIdx]: optionIdx };
    setAnswers(updated);

    try {
      if (loggedStudentRef.current) {
        localStorage.setItem(`cbt_ans_${loggedStudentRef.current.id}`, JSON.stringify(updated));
      }
    } catch (_) {}

    if (loggedStudentRef.current) {
      syncApi.updateStudent({
        id: loggedStudentRef.current.id,
        savedAnswers: updated,
        currentQuestionIdx: qIdx,
        savedTimeLeft: timeLeftRef.current || timeLeft,
        lastActiveAt: new Date().toISOString(),
        status: 'active'
      });
    }

    if (db && loggedStudentRef.current) {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', loggedStudentRef.current.id), {
        savedAnswers: updated,
        currentQuestionIdx: qIdx,
        savedTimeLeft: timeLeftRef.current || timeLeft,
        lastActiveAt: new Date().toISOString(),
        status: 'active'
      }, { merge: true }).catch(err => console.error("Realtime sync error:", err));
    }
  };

  const toggleDoubtful = (qIdx: number) => {
    const updated = { ...doubtfulAnswers, [qIdx]: !doubtfulAnswers[qIdx] };
    setDoubtfulAnswers(updated);

    try {
      if (loggedStudentRef.current) {
        localStorage.setItem(`cbt_doubt_${loggedStudentRef.current.id}`, JSON.stringify(updated));
      }
    } catch (_) {}

    if (loggedStudentRef.current) {
      syncApi.updateStudent({
        id: loggedStudentRef.current.id,
        savedDoubtful: updated,
        lastActiveAt: new Date().toISOString()
      });
    }

    if (db && loggedStudentRef.current) {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', loggedStudentRef.current.id), {
        savedDoubtful: updated,
        lastActiveAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Realtime sync error:", err));
    }
  };

  const handleFinishExam = async (isForced = false) => {
    let correct = 0;
    let wrong = 0;

    const currentAnswers = answersRef.current || answers;

    questions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const resultObj = {
      correctCount: correct,
      wrongCount: wrong,
      score: score
    };

    setFinalScore(resultObj);
    if (isForced) setForcedSubmitNotice(true);
    setRole('student_result');

    const currentStudent = loggedStudentRef.current || loggedStudent;

    if (currentStudent) {
      const submissionId = `${currentStudent.id}_${Date.now()}`;
      const submissionData: Submission = {
        id: submissionId,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentClass: currentStudent.class,
        username: currentStudent.username,
        session: currentStudent.session || 'Sesi 1',
        answers: currentAnswers,
        correct: correct,
        wrong: wrong,
        score: score,
        submittedAt: new Date().toISOString(),
        isForced: isForced,
        subjectName: activeExamPackage?.subjectName || 'Tes Intelegensi Umum',
        examTitle: activeExamPackage?.title || 'Assesmen Sumatif CBT'
      };

      try {
        localStorage.removeItem(`cbt_ans_${currentStudent.id}`);
      } catch (_) {}

      // Immediately sync local submissions state for instant teacher view
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.studentId !== currentStudent.id);
        return [submissionData, ...filtered];
      });

      // Update student status to completed
      const updatedStudent: Student = {
        ...currentStudent,
        status: 'completed',
        examAllowed: false
      };

      setLoggedStudent(updatedStudent);
      setStudents(prev => prev.map(s => s.id === currentStudent.id ? updatedStudent : s));

      syncApi.addSubmission(submissionData);
      syncApi.updateStudent({
        id: currentStudent.id,
        status: 'completed',
        examAllowed: false,
        lastActiveAt: new Date().toISOString()
      });

      if (db) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_submissions_v1', submissionId), submissionData);
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', currentStudent.id), {
            status: 'completed',
            examAllowed: false,
            lastActiveAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error("Error saving submission:", err);
        }
      }
    }
  };

  const toggleStudentAccess = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;
    const newAllowedStatus = !target.examAllowed;

    const updated = students.map(s => s.id === studentId ? { ...s, examAllowed: newAllowedStatus } : s);
    setStudents(updated);
    showToast(`Akses ujian ${target.name} diperbarui!`);

    syncApi.updateStudent({ id: studentId, examAllowed: newAllowedStatus });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), { examAllowed: newAllowedStatus }, { merge: true });
      } catch (err) {
        console.error("Error toggling access:", err);
      }
    }
  };

  const confirmDeleteSingleStudent = (student: Student) => {
    setDeleteConfirmTarget(student);
  };

  const executeDeleteStudent = async () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget === 'bulk') {
      await handleBulkDeleteExecuted();
      setDeleteConfirmTarget(null);
      return;
    }

    const target = deleteConfirmTarget;
    setStudents(prev => prev.filter(s => s.id !== target.id));
    setSelectedStudentIds(prev => prev.filter(id => id !== target.id));
    showToast(`Data siswa "${target.name}" berhasil dihapus.`);

    syncApi.deleteStudent(target.id);

    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', target.id));
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
    setDeleteConfirmTarget(null);
  };

  const handleBulkDeleteExecuted = async () => {
    if (selectedStudentIds.length === 0) return;

    const count = selectedStudentIds.length;
    const idsToDelete = [...selectedStudentIds];
    setStudents(prev => prev.filter(s => !idsToDelete.includes(s.id)));
    setSelectedStudentIds([]);
    showToast(`Berhasil menghapus ${count} siswa.`);

    syncApi.bulkDeleteStudents(idsToDelete);

    if (db) {
      for (const id of idsToDelete) {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', id));
        } catch (err) {
          console.error("Error bulk deleting student:", err);
        }
      }
    }
  };

  const handleBulkToggleAccess = async (allowed: boolean) => {
    if (selectedStudentIds.length === 0) return;
    const updated = students.map(s => selectedStudentIds.includes(s.id) ? { ...s, examAllowed: allowed } : s);
    setStudents(updated);

    syncApi.updateStudents(students.filter(s => selectedStudentIds.includes(s.id)).map(s => ({ ...s, examAllowed: allowed })));
    showToast(`Akses Ujian ${selectedStudentIds.length} siswa berhasil diperbarui.`);

    if (db) {
      for (const id of selectedStudentIds) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', id), { examAllowed: allowed }, { merge: true });
        } catch (err) {
          console.error("Error bulk access setting:", err);
        }
      }
    }
  };

  const getFilteredStudents = () => {
    const searchLower = studentSearch.trim().toLowerCase();
    let result = students.filter(s => {
      const matchesSearch = !searchLower || 
        s.name.toLowerCase().includes(searchLower) ||
        s.class.toLowerCase().includes(searchLower) ||
        s.username.toLowerCase().includes(searchLower);

      let matchesGrade = true;
      if (studentGradeFilter !== 'ALL') {
        const clsUpper = (s.class || '').trim().toUpperCase();
        if (studentGradeFilter === 'X') {
          matchesGrade = clsUpper.startsWith('X ') || clsUpper === 'X' || clsUpper.startsWith('10');
        } else if (studentGradeFilter === 'XI') {
          matchesGrade = clsUpper.startsWith('XI ') || clsUpper === 'XI' || clsUpper.startsWith('11');
        } else if (studentGradeFilter === 'XII') {
          matchesGrade = clsUpper.startsWith('XII ') || clsUpper === 'XII' || clsUpper.startsWith('12');
        }
      }

      const matchesClass = studentClassFilter === 'ALL' || s.class.toLowerCase() === studentClassFilter.toLowerCase();
      return matchesSearch && matchesGrade && matchesClass;
    });

    return result.sort((a, b) => {
      if (studentSortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'id');
      } else if (studentSortBy === 'name_desc') {
        return b.name.localeCompare(a.name, 'id');
      } else if (studentSortBy === 'class_asc') {
        const classComp = a.class.localeCompare(b.class, 'id', { numeric: true });
        return classComp !== 0 ? classComp : a.name.localeCompare(b.name, 'id');
      } else if (studentSortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
    });
  };

  const getFilteredSubmissions = () => {
    const searchLower = submissionSearch.trim().toLowerCase();
    let result = submissions.filter(s => {
      const matchesSearch = !searchLower || 
        s.studentName.toLowerCase().includes(searchLower) ||
        (s.studentClass && s.studentClass.toLowerCase().includes(searchLower)) ||
        (s.username && s.username.toLowerCase().includes(searchLower));

      let matchesGrade = true;
      if (submissionGradeFilter !== 'ALL') {
        const clsUpper = (s.studentClass || '').trim().toUpperCase();
        if (submissionGradeFilter === 'X') {
          matchesGrade = clsUpper.startsWith('X ') || clsUpper === 'X' || clsUpper.startsWith('10');
        } else if (submissionGradeFilter === 'XI') {
          matchesGrade = clsUpper.startsWith('XI ') || clsUpper === 'XI' || clsUpper.startsWith('11');
        } else if (submissionGradeFilter === 'XII') {
          matchesGrade = clsUpper.startsWith('XII ') || clsUpper === 'XII' || clsUpper.startsWith('12');
        }
      }

      const matchesClass = submissionClassFilter === 'ALL' || (s.studentClass && s.studentClass.toLowerCase() === submissionClassFilter.toLowerCase());
      return matchesSearch && matchesGrade && matchesClass;
    });

    return result.sort((a, b) => {
      if (submissionSortBy === 'time_desc') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (submissionSortBy === 'name_asc') {
        return a.studentName.localeCompare(b.studentName, 'id');
      } else if (submissionSortBy === 'name_desc') {
        return b.studentName.localeCompare(a.studentName, 'id');
      } else if (submissionSortBy === 'class_asc') {
        const classComp = (a.studentClass || '').localeCompare(b.studentClass || '', 'id', { numeric: true });
        return classComp !== 0 ? classComp : a.studentName.localeCompare(b.studentName, 'id');
      } else if (submissionSortBy === 'score_desc') {
        return b.score - a.score;
      } else if (submissionSortBy === 'score_asc') {
        return a.score - b.score;
      }
      return 0;
    });
  };

  const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const visibleStudents = getFilteredStudents();
    if (e.target.checked) {
      const visibleIds = visibleStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      const visibleIds = visibleStudents.map(s => s.id);
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const parseTextToStudents = (rawText: string): Student[] => {
    if (!rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/);
    const parsedList: Student[] = [];

    lines.forEach((line, idx) => {
      const cols = line.split(/[\t,;]+/).map(c => c.trim());
      if (cols.length >= 2) {
        if (idx === 0 && (cols[0].toLowerCase().includes('nama') || cols[0].toLowerCase().includes('name'))) {
          return;
        }

        const name = cols[0];
        const studentClass = cols[1] || 'Umum';
        const username = cols[2] || `siswa_${Date.now().toString().slice(-4)}_${idx + 1}`;
        const password = cols[3] || '123';

        if (name) {
          parsedList.push({
            id: 'std-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
            name: name,
            class: studentClass,
            username: username.toLowerCase().replace(/\s+/g, ''),
            password: password,
            examAllowed: true,
            status: 'idle',
            violationCount: 0,
            lastViolationReason: ''
          });
        }
      }
    });
    return parsedList;
  };

  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        const preview = parseTextToStudents(text);
        setImportPreviewData(preview);
      }
    };
    reader.readAsText(file);
  };

  const handleImportTextChange = (val: string) => {
    setImportText(val);
    const preview = parseTextToStudents(val);
    setImportPreviewData(preview);
  };

  const handleProcessImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccessMsg('');

    const newStudentsList = importPreviewData.length > 0 ? importPreviewData : parseTextToStudents(importText);

    if (newStudentsList.length === 0) {
      setImportError('Format data tidak valid / tidak ada data siswa. Gunakan format minimal: Nama | Kelas | Username | Password');
      return;
    }

    setStudents(prev => [...prev, ...newStudentsList]);
    syncApi.updateStudents(newStudentsList);

    if (db) {
      for (const s of newStudentsList) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', s.id), s);
        } catch (err) {
          console.error("Error saving imported student:", err);
        }
      }
    }

    setImportSuccessMsg(`Berhasil mengimpor ${newStudentsList.length} siswa baru!`);
    showToast(`Berhasil menambahkan ${newStudentsList.length} siswa ke database.`);
    setTimeout(() => {
      setShowImportModal(false);
      setImportText('');
      setImportPreviewData([]);
      setImportSuccessMsg('');
    }, 1200);
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStudentError('');
    if (!editingStudent) return;

    const isDuplicate = students.some(
      s => s.id !== editingStudent.id && s.username.toLowerCase() === editingStudent.username.trim().toLowerCase()
    );

    if (isDuplicate) {
      setEditStudentError('Username sudah digunakan oleh siswa lain!');
      return;
    }

    const updatedStudentObj: Student = {
      ...editingStudent,
      name: editingStudent.name.trim(),
      class: editingStudent.class.trim(),
      username: editingStudent.username.trim().toLowerCase(),
      password: editingStudent.password.trim()
    };

    const updatedList = students.map(s => s.id === updatedStudentObj.id ? updatedStudentObj : s);
    setStudents(updatedList);
    showToast(`Data siswa "${updatedStudentObj.name}" berhasil diperbarui.`);

    syncApi.updateStudent(updatedStudentObj);

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', updatedStudentObj.id), updatedStudentObj, { merge: true });
      } catch (err) {
        console.error("Error updating student:", err);
      }
    }

    setEditingStudent(null);
    setEditStudentError('');
  };

  const unlockStudentExam = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    const updated = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          examAllowed: true, 
          status: 'active' as const,
          unlockedAfterSuspension: true,
          lastActiveAt: new Date().toISOString()
        };
      }
      return s;
    });
    setStudents(updated);
    if (loggedStudent?.id === studentId) {
      setLoggedStudent(prev => prev ? { ...prev, examAllowed: true, status: 'active', unlockedAfterSuspension: true } : null);
    }
    showToast(`🔓 Ujian untuk ${target?.name || 'siswa'} berhasil dibuka kunci! Siswa dapat melanjutkan soal.`);

    syncApi.updateStudent({
      id: studentId,
      examAllowed: true,
      status: 'active',
      unlockedAfterSuspension: true,
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          examAllowed: true,
          status: 'active',
          unlockedAfterSuspension: true,
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error unlocking student exam:", err);
      }
    }
  };

  const pauseStudentExam = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const updated = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          status: 'paused' as const,
          lastActiveAt: new Date().toISOString()
        };
      }
      return s;
    });
    setStudents(updated);
    if (loggedStudent?.id === studentId) {
      setLoggedStudent(prev => prev ? { ...prev, status: 'paused' } : null);
    }
    showToast(`⏸️ Ujian untuk ${target.name} berhasil dijeda.`);

    syncApi.updateStudent({
      id: studentId,
      status: 'paused',
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          status: 'paused',
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error pausing student exam:", err);
      }
    }
  };

  const resumeStudentExam = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const updated = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          status: 'active' as const,
          examAllowed: true,
          unlockedAfterSuspension: s.status === 'suspended' ? true : s.unlockedAfterSuspension,
          lastActiveAt: new Date().toISOString()
        };
      }
      return s;
    });
    setStudents(updated);
    if (loggedStudent?.id === studentId) {
      setLoggedStudent(prev => prev ? { ...prev, status: 'active', examAllowed: true } : null);
    }
    showToast(`▶️ Ujian untuk ${target.name} berhasil dilanjutkan.`);

    syncApi.updateStudent({
      id: studentId,
      status: 'active',
      examAllowed: true,
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          status: 'active',
          examAllowed: true,
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error resuming student exam:", err);
      }
    }
  };

  const handleBulkPauseStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const targets = students.filter(s => selectedStudentIds.includes(s.id) && s.status === 'active');
    if (targets.length === 0) {
      showToast('Tidak ada siswa aktif terpilih yang dapat dijeda.');
      return;
    }

    const updated = students.map(s => {
      if (selectedStudentIds.includes(s.id) && s.status === 'active') {
        return { ...s, status: 'paused' as const, lastActiveAt: new Date().toISOString() };
      }
      return s;
    });

    setStudents(updated);
    showToast(`⏸️ Ujian untuk ${targets.length} siswa berhasil dijeda.`);
    await syncApi.updateStudents(updated);
  };

  const handleBulkResumeStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const targets = students.filter(s => selectedStudentIds.includes(s.id) && (s.status === 'paused' || s.status === 'suspended'));
    if (targets.length === 0) {
      showToast('Tidak ada siswa terpilih yang sedang dijeda atau terkunci.');
      return;
    }

    const updated = students.map(s => {
      if (selectedStudentIds.includes(s.id) && (s.status === 'paused' || s.status === 'suspended')) {
        return { 
          ...s, 
          status: 'active' as const, 
          examAllowed: true, 
          unlockedAfterSuspension: s.status === 'suspended' ? true : s.unlockedAfterSuspension,
          lastActiveAt: new Date().toISOString() 
        };
      }
      return s;
    });

    setStudents(updated);
    showToast(`▶️ Ujian untuk ${targets.length} siswa berhasil dilanjutkan.`);
    await syncApi.updateStudents(updated);
  };

  const handleBulkForceSubmitStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const targets = students.filter(s => selectedStudentIds.includes(s.id) && s.status !== 'completed' && s.status !== 'force_submitted');
    if (targets.length === 0) {
      showToast('Tidak ada siswa ujian terpilih yang dapat dihentikan.');
      return;
    }

    const isOk = window.confirm(`Hentikan ujian untuk ${targets.length} siswa terpilih dan kumpulkan jawaban mereka sekarang meski waktu belum berakhir?`);
    if (!isOk) return;

    for (const target of targets) {
      await forceSubmitStudentExam(target.id);
    }
    showToast(`⏹️ Ujian untuk ${targets.length} siswa berhasil dihentikan.`);
  };

  const addExtraTime = async (studentId: string, extraSeconds: number) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const currentTime = typeof target.savedTimeLeft === 'number' ? target.savedTimeLeft : TOTAL_TIME_SECONDS;
    const newTime = currentTime + extraSeconds;

    const updated = students.map(s => {
      if (s.id === studentId) {
        return { ...s, savedTimeLeft: newTime, lastActiveAt: new Date().toISOString() };
      }
      return s;
    });
    setStudents(updated);
    showToast(`⏰ Waktu +${Math.round(extraSeconds / 60)} menit diberikan ke ${target.name}!`);

    syncApi.updateStudent({
      id: studentId,
      savedTimeLeft: newTime,
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          savedTimeLeft: newTime,
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error adding extra time:", err);
      }
    }
  };

  const forceSubmitStudentExam = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    let correct = 0;
    let wrong = 0;
    const studentAnswers = target.savedAnswers || {};
    questions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.answer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    const submissionData: Submission = {
      id: `${target.id}_${Date.now()}`,
      studentId: target.id,
      studentName: target.name,
      studentClass: target.class,
      username: target.username,
      answers: studentAnswers,
      correct: correct,
      wrong: wrong,
      score: score,
      submittedAt: new Date().toISOString(),
      isForced: true
    };

    setSubmissions(prev => {
      const filtered = prev.filter(s => s.studentId !== target.id);
      return [submissionData, ...filtered];
    });

    const updated = students.map(s => {
      if (s.id === studentId) {
        return { ...s, status: 'completed' as const, examAllowed: false, lastActiveAt: new Date().toISOString() };
      }
      return s;
    });
    setStudents(updated);
    if (loggedStudent?.id === studentId) {
      setLoggedStudent(prev => prev ? { ...prev, status: 'completed', examAllowed: false } : null);
    }
    showToast(`⏹️ Ujian ${target.name} dihentikan dan hasilnya langsung masuk ke Hasil Ujian.`);

    syncApi.addSubmission(submissionData);
    syncApi.updateStudent({
      id: studentId,
      status: 'completed',
      examAllowed: false,
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_submissions_v1', submissionData.id), submissionData);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          status: 'completed',
          examAllowed: false,
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error force submitting exam:", err);
      }
    }
  };

  const forceSubmitAllActiveStudents = async () => {
    const activeStudents = students.filter(s => s.status === 'active' || s.status === 'suspended');
    if (activeStudents.length === 0) {
      showToast("Tidak ada siswa yang sedang aktif pengerjaan.");
      return;
    }

    const newSubmissions: Submission[] = [];
    const updated = students.map(s => {
      if (s.status === 'active' || s.status === 'suspended') {
        let correct = 0;
        let wrong = 0;
        const studentAnswers = s.savedAnswers || {};
        questions.forEach((q, idx) => {
          if (studentAnswers[idx] === q.answer) {
            correct++;
          } else {
            wrong++;
          }
        });
        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

        const sub: Submission = {
          id: `${s.id}_${Date.now()}`,
          studentId: s.id,
          studentName: s.name,
          studentClass: s.class,
          username: s.username,
          answers: studentAnswers,
          correct: correct,
          wrong: wrong,
          score: score,
          submittedAt: new Date().toISOString(),
          isForced: true
        };
        newSubmissions.push(sub);

        return { ...s, status: 'completed', examAllowed: false, lastActiveAt: new Date().toISOString() };
      }
      return s;
    });

    setSubmissions(prev => {
      const activeIds = new Set(newSubmissions.map(s => s.studentId));
      const filtered = prev.filter(s => !activeIds.has(s.studentId));
      return [...newSubmissions, ...filtered];
    });

    setStudents(updated);
    showToast(`📤 Berhasil menghentikan & menyimpan hasil ujian ${activeStudents.length} siswa!`);

    for (const sub of newSubmissions) {
      syncApi.addSubmission(sub);
      syncApi.updateStudent({
        id: sub.studentId,
        status: 'completed',
        examAllowed: false,
        lastActiveAt: new Date().toISOString()
      });
    }

    if (db) {
      for (const sub of newSubmissions) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_submissions_v1', sub.id), sub);
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', sub.studentId), {
            status: 'completed',
            examAllowed: false,
            lastActiveAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error("Error bulk force submitting:", err);
        }
      }
    }
  };

  const handleResetStudentExam = async (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    const updated = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          examAllowed: true, 
          status: 'idle',
          violationCount: 0,
          lastViolationReason: '',
          savedAnswers: {},
          savedDoubtful: {},
          savedTimeLeft: TOTAL_TIME_SECONDS,
          currentQuestionIdx: 0,
          lastActiveAt: new Date().toISOString()
        };
      }
      return s;
    });
    setStudents(updated);
    showToast(`🔄 Sesi ujian ${target?.name || 'siswa'} telah direset!`);

    syncApi.updateStudent({
      id: studentId,
      examAllowed: true,
      status: 'idle',
      violationCount: 0,
      lastViolationReason: '',
      savedAnswers: {},
      savedDoubtful: {},
      savedTimeLeft: TOTAL_TIME_SECONDS,
      currentQuestionIdx: 0,
      lastActiveAt: new Date().toISOString()
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', studentId), {
          examAllowed: true,
          status: 'idle',
          violationCount: 0,
          lastViolationReason: '',
          savedAnswers: {},
          savedDoubtful: {},
          savedTimeLeft: TOTAL_TIME_SECONDS,
          currentQuestionIdx: 0,
          lastActiveAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Error resetting student exam:", err);
      }
    }
  };

  const handleSaveQuestionPackage = (pkgData: Omit<QuestionPackage, 'questions'>) => {
    let updated: QuestionPackage[];
    const existing = questionPackages.find(p => p.id === pkgData.id);

    if (existing) {
      updated = questionPackages.map(p => p.id === pkgData.id ? { ...p, ...pkgData } : p);
      showToast(`Paket soal "${pkgData.title}" berhasil diperbarui.`);
    } else {
      const newPkg: QuestionPackage = {
        ...pkgData,
        questions: []
      };
      updated = [...questionPackages, newPkg];
      setSelectedPackageId(newPkg.id);
      setQuestions([]);
      showToast(`Paket soal baru "${pkgData.title}" berhasil dibuat!`);
    }

    setQuestionPackages(updated);
    syncApi.updateQuestionPackages(updated);
  };

  const handleDeleteQuestionPackage = (id: string) => {
    const pkg = questionPackages.find(p => p.id === id);
    if (!pkg) return;

    if (questionPackages.length <= 1) {
      showToast("Gagal hapus: Bank soal minimal harus memiliki 1 paket soal.");
      return;
    }

    const updated = questionPackages.filter(p => p.id !== id);
    setQuestionPackages(updated);
    if (selectedPackageId === id) {
      const nextPkg = updated[0];
      setSelectedPackageId(nextPkg?.id || '');
      if (nextPkg) setQuestions(nextPkg.questions || []);
    }
    showToast(`Paket soal "${pkg.title}" dihapus.`);
    syncApi.deleteQuestionPackage(id);
  };

  const handleSaveExamPackage = (examData: ExamPackage) => {
    let updated: ExamPackage[];
    const existing = examPackages.find(e => e.id === examData.id);

    if (existing) {
      updated = examPackages.map(e => e.id === examData.id ? examData : e);
      showToast(`Paket ujian "${examData.title}" diperbarui.`);
    } else {
      updated = [...examPackages, examData];
      showToast(`Paket ujian baru "${examData.title}" berhasil dibuat!`);
    }

    setExamPackages(updated);
    syncApi.updateExamPackages(updated);
  };

  const handleDeleteExamPackage = (id: string) => {
    const exam = examPackages.find(e => e.id === id);
    if (!exam) return;

    const updated = examPackages.filter(e => e.id !== id);
    setExamPackages(updated);
    showToast(`Paket ujian "${exam.title}" dihapus.`);
    syncApi.deleteExamPackage(id);
  };

  const handleToggleExamPackage = (id: string, currentActive: boolean) => {
    const updated = examPackages.map(e => e.id === id ? { ...e, isActive: !currentActive } : e);
    setExamPackages(updated);
    const target = updated.find(e => e.id === id);
    showToast(`Status Ujian "${target?.title}": ${!currentActive ? 'AKTIF 🟢' : 'NONAKTIF 🔴'}`);
    syncApi.updateExamPackages(updated);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionFormData.text.trim()) return;

    let targetId = questionFormData.id;
    if (!targetId) {
      targetId = 'q-' + Date.now();
    }

    const questionObj: Question = {
      id: targetId,
      text: questionFormData.text.trim(),
      options: questionFormData.options.map(o => o.trim()),
      answer: questionFormData.answer
    };

    let updatedQuestionsList: Question[] = [];

    if (editingQuestionIdx !== null) {
      updatedQuestionsList = [...questions];
      updatedQuestionsList[editingQuestionIdx] = questionObj;
      setQuestions(updatedQuestionsList);
      showToast(`Soal #${editingQuestionIdx + 1} berhasil diperbarui.`);
    } else {
      updatedQuestionsList = [...questions, questionObj];
      setQuestions(updatedQuestionsList);
      showToast("Soal baru berhasil ditambahkan!");
    }

    // Sync into selected QuestionPackage
    const currentPkgIndex = questionPackages.findIndex(p => p.id === selectedPackageId);
    if (currentPkgIndex !== -1) {
      const updatedPkgs = [...questionPackages];
      updatedPkgs[currentPkgIndex].questions = updatedQuestionsList;
      setQuestionPackages(updatedPkgs);
      syncApi.updateQuestionPackages(updatedPkgs);
    }

    syncApi.updateQuestions([questionObj]);

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_questions_v1', targetId), questionObj);
      } catch (err) {
        console.error("Error saving question:", err);
      }
    }

    setShowQuestionModal(false);
  };

  const handleDeleteQuestion = async (qIdx: number) => {
    const targetQ = questions[qIdx];
    if (!targetQ) return;

    const updatedQuestionsList = questions.filter((_, idx) => idx !== qIdx);
    setQuestions(updatedQuestionsList);
    showToast(`Soal #${qIdx + 1} dihapus.`);

    // Sync into selected QuestionPackage
    const currentPkgIndex = questionPackages.findIndex(p => p.id === selectedPackageId);
    if (currentPkgIndex !== -1) {
      const updatedPkgs = [...questionPackages];
      updatedPkgs[currentPkgIndex].questions = updatedQuestionsList;
      setQuestionPackages(updatedPkgs);
      syncApi.updateQuestionPackages(updatedPkgs);
    }

    if (targetQ.id) {
      syncApi.deleteQuestion(targetQ.id);
    }

    if (db && targetQ.id) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_questions_v1', targetQ.id));
      } catch (err) {
        console.error("Error deleting question:", err);
      }
    }
  };

  const handleResetQuestionsToDefault = async () => {
    setQuestions(DEFAULT_QUESTIONS);
    showToast("Bank soal direset ke 30 Soal Hukum Newton.");

    syncApi.updateQuestions(DEFAULT_QUESTIONS);

    if (db) {
      for (const q of DEFAULT_QUESTIONS) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_questions_v1', String(q.id)), q);
        } catch (err) {
          console.error("Error syncing default question:", err);
        }
      }
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    setSubmissions(prev => prev.filter(s => s.id !== subId));
    showToast("Hasil ujian siswa dihapus.");

    syncApi.deleteSubmission(subId);

    if (db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_submissions_v1', subId));
      } catch (err) {
        console.error("Error deleting submission:", err);
      }
    }
  };

  const updateExamConfig = async (newToken: string, newIsActive: boolean, newUnlockPin = unlockPin, newActiveSession = activeSession) => {
    setExamToken(newToken);
    setIsExamActiveGlobal(newIsActive);
    setUnlockPin(newUnlockPin);
    setActiveSession(newActiveSession);
    showToast("Pengaturan Ujian & Sesi disimpan!");

    syncApi.updateConfig({
      examToken: newToken,
      isExamActiveGlobal: newIsActive,
      unlockPin: newUnlockPin,
      activeSession: newActiveSession
    });

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_config_v1', 'settings'), {
          examToken: newToken,
          isExamActiveGlobal: newIsActive,
          unlockPin: newUnlockPin,
          activeSession: newActiveSession
        }, { merge: true });
      } catch (err) {
        console.error("Error updating config:", err);
      }
    }
  };

  const handleResetAllStudentsExamStatus = async () => {
    const isOk = window.confirm('Reset status ujian seluruh siswa? Progres pengerjaan akan kembali siap untuk login/ujian baru. Laporan nilai yang sudah terkumpul tetap tersimpan aman di tab Hasil Ujian.');
    if (!isOk) return;

    const updated = students.map(s => ({
      ...s,
      status: 'idle' as const,
      examAllowed: true,
      violationCount: 0,
      lastViolationReason: '',
      savedAnswers: {},
      savedDoubtful: {},
      savedTimeLeft: TOTAL_TIME_SECONDS,
      currentQuestionIdx: 0,
      lastActiveAt: new Date().toISOString()
    }));

    setStudents(updated);
    showToast('🔄 Status pengerjaan seluruh siswa berhasil direset!');
    await syncApi.updateStudents(updated);
  };

  const handleUnlockAllSuspended = async () => {
    const suspendedList = students.filter(s => s.status === 'suspended');
    if (suspendedList.length === 0) {
      showToast('Tidak ada siswa yang berstatus terkunci.');
      return;
    }
    const updated = students.map(s => {
      if (s.status === 'suspended') {
        return {
          ...s,
          status: 'idle' as const,
          violationCount: 0,
          lastViolationReason: ''
        };
      }
      return s;
    });
    setStudents(updated);
    showToast(`🔓 Berhasil membuka kunci ${suspendedList.length} siswa terkunci.`);
    await syncApi.updateStudents(updated);
  };

  const handleSetGlobalExamAccess = async (allowed: boolean) => {
    const updated = students.map(s => ({ ...s, examAllowed: allowed }));
    setStudents(updated);
    showToast(`${allowed ? '🔓 Seluruh siswa diizinkan' : '🔒 Seluruh siswa dikunci dari'} ujian.`);
    await syncApi.updateStudents(updated);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError('');

    if (!newStudent.name || !newStudent.class || !newStudent.username || !newStudent.password) {
      setAddStudentError('Semua kolom wajib diisi!');
      return;
    }

    if (students.some(s => s.username.toLowerCase() === newStudent.username.trim().toLowerCase())) {
      setAddStudentError('Username sudah digunakan oleh siswa lain!');
      return;
    }

    const newStudentObj: Student = {
      id: 'std-' + Date.now(),
      name: newStudent.name.trim(),
      class: newStudent.class.trim(),
      username: newStudent.username.trim().toLowerCase(),
      password: newStudent.password.trim(),
      examAllowed: true,
      status: 'idle',
      violationCount: 0,
      lastViolationReason: ''
    };

    setStudents(prev => [...prev, newStudentObj]);
    showToast(`Siswa "${newStudentObj.name}" berhasil ditambahkan.`);

    syncApi.updateStudent(newStudentObj);

    if (db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'cbt_students_v1', newStudentObj.id), newStudentObj);
      } catch (err) {
        console.error("Error adding student:", err);
      }
    }

    setNewStudent({ name: '', class: '', username: '', password: '' });
    setShowAddStudentModal(false);
  };

  const handleSaveStaffUser = async (userToSave: StaffUser) => {
    const existingIndex = staffUsers.findIndex(u => u.id === userToSave.id);
    let updated: StaffUser[];
    if (existingIndex >= 0) {
      updated = staffUsers.map(u => u.id === userToSave.id ? userToSave : u);
    } else {
      updated = [...staffUsers, userToSave];
    }
    setStaffUsers(updated);
    showToast(`Akun staf "${userToSave.name}" (${userToSave.role.toUpperCase()}) disimpan.`);
    await syncApi.updateStaffUser(userToSave);
  };

  const handleDeleteStaffUser = async (staffId: string) => {
    const target = staffUsers.find(u => u.id === staffId);
    setStaffUsers(prev => prev.filter(u => u.id !== staffId));
    showToast(`Akun staf "${target?.name || ''}" dihapus.`);
    await syncApi.deleteStaffUser(staffId);
  };

  const handleAddSubject = async (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) {
      setNewSubjectError('Nama mata pelajaran tidak boleh kosong.');
      return;
    }
    if (subjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSubjectError(`Mata pelajaran "${trimmed}" sudah ada di dalam daftar.`);
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    setNewSubjectInput('');
    setNewSubjectError('');
    showToast(`Mata pelajaran "${trimmed}" berhasil ditambahkan!`);
    await syncApi.addSubject(trimmed);
  };

  const handleDeleteSubject = async (subjectName: string) => {
    const updated = subjects.filter(s => s.toLowerCase() !== subjectName.toLowerCase());
    setSubjects(updated);
    showToast(`Mata pelajaran "${subjectName}" telah dihapus.`);
    await syncApi.deleteSubject(subjectName);
  };

  const handleResetSubjectsToDefault = async () => {
    if (window.confirm('Reset daftar mata pelajaran ke daftar standar (16 Mapel)?')) {
      setSubjects(DEFAULT_SUBJECTS);
      showToast('Daftar mata pelajaran dikembalikan ke standar.');
      await syncApi.updateSubjects(DEFAULT_SUBJECTS);
    }
  };

  const exportStudentsToCSV = () => {
    const listToExport = getFilteredStudents();
    if (listToExport.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFNo,Nama Siswa,Kelas,Username,Password,Akses Ujian,Status Ujian\n";
    listToExport.forEach((s, idx) => {
      csvContent += `${idx + 1},"${s.name}","${s.class}","${s.username}","${s.password}",${s.examAllowed ? 'Diizinkan' : 'Diblokir'},"${s.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const classTag = studentClassFilter !== 'ALL' ? `_${studentClassFilter.replace(/\s+/g, '_')}` : '';
    link.setAttribute("download", `Daftar_Akun_Siswa_CBT${classTag}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSubmissionsToCSV = () => {
    const listToExport = getFilteredSubmissions();
    if (listToExport.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFFNo,Nama Siswa,Kelas,Mata Pelajaran,Username,Jawaban Benar,Jawaban Salah,Nilai,Waktu Kirim\n";
    listToExport.forEach((s, idx) => {
      csvContent += `${idx + 1},"${s.studentName}","${s.studentClass}","${s.subjectName || 'Fisika'}",${s.username},${s.correct},${s.wrong},${s.score},"${formatDate(s.submittedAt)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const classTag = submissionClassFilter !== 'ALL' ? `_${submissionClassFilter.replace(/\s+/g, '_')}` : '';
    link.setAttribute("download", `Rekap_Nilai_CBT${classTag}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (role === 'selection') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <GraduationCap size={44} className="text-white" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">CBT ONLINE SMAN1 TOILI</h1>
          <p className="text-slate-400 text-sm mb-8">Assesmen Sumatif</p>

          <div className="space-y-4">
            <button 
              onClick={() => setRole('student_login')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 text-base cursor-pointer"
            >
              <UserCheck size={22} /> Masuk Sebagai Siswa
            </button>

            <button 
              onClick={() => {
                setRole('teacher_auth');
                setPasswordError('');
                setStaffLoginInput({ username: '', password: '' });
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-6 rounded-2xl transition-all border border-slate-600 flex items-center justify-center gap-3 text-base cursor-pointer"
            >
              <Shield size={22} /> Portal Staf (Admin, Guru, Pengawas)
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/60 text-xs text-slate-400 font-semibold tracking-wide">
            © 2026 CBT Online by Khoirul. All rights reserved.
              Developed with dedication for better education.
          </div>
        </div>
      </div>
    );
  }

  if (role === 'student_paused') {
    const isResumedByTeacher = loggedStudent?.status === 'active' && loggedStudent?.examAllowed;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 select-none">
        <div className="bg-slate-900 border-2 border-indigo-500/50 p-8 rounded-3xl shadow-2xl w-full max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 animate-pulse"></div>
          
          <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <Hourglass size={44} className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">UJIAN DIJEDA SEMENTARA</h2>
          <p className="text-indigo-300 font-semibold text-xs mb-6 bg-indigo-950/60 p-3 rounded-xl border border-indigo-500/30">
            Sesi ujian Anda sedang dijeda oleh Admin / Pengawas Ruang.
          </p>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-left text-xs text-slate-300 space-y-2 mb-6">
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Siswa:</span>
              <span className="font-bold text-white">{loggedStudent?.name} ({loggedStudent?.class})</span>
            </div>
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Status Waktu:</span>
              <span className="font-bold text-amber-400">Dihentikan Sementara (Tidak Berkurang)</span>
            </div>
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Sisa Waktu Ujian:</span>
              <span className="font-bold font-mono text-emerald-400">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Jawaban:</span>
              <span className="font-bold text-emerald-400">Tersimpan Aman di Server</span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-300 text-xs text-left mb-6 leading-relaxed flex items-start gap-3">
            <Clock size={20} className="flex-shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <p className="font-bold mb-1 text-white">Petunjuk:</p>
              Harap tetap tenang di depan layar perangkat Anda. Waktu ujian Anda tidak akan berkurang selama jeda aktif. Begitu Admin atau Pengawas mengaktifkan kembali, Anda dapat langsung melanjutkan mengerjakan soal.
            </div>
          </div>

          <div className="space-y-3">
            {isResumedByTeacher ? (
              <button 
                onClick={() => resumeExamForStudent()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-4 rounded-xl text-sm transition-all shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2 animate-bounce cursor-pointer"
              >
                <CheckCircle size={22} /> LANJUTKAN MENGERJAKAN SOAL SEKARANG
              </button>
            ) : (
              <button 
                onClick={() => {
                  const currentInDb = students.find(s => s.id === loggedStudent?.id);
                  if (currentInDb && currentInDb.status === 'active' && currentInDb.examAllowed) {
                    resumeExamForStudent(currentInDb);
                  } else {
                    showToast("Sesi ujian masih dijeda oleh Admin / Pengawas...");
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <RefreshCw size={16} className="mr-1.5 animate-spin"/> Cek Status / Lanjutkan Ujian
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'student_suspended') {
    const isUnlockedByTeacher = loggedStudent?.status === 'active' && loggedStudent?.examAllowed;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 select-none">
        <div className="bg-slate-900 border-2 border-amber-500/50 p-8 rounded-3xl shadow-2xl w-full max-w-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-red-500 to-amber-600 animate-pulse"></div>
          
          <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
            <ShieldAlert size={44} />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">UJIAN TERKUNCI SEMENTARA</h2>
          
          {isUnlockedByTeacher ? (
            <div className="bg-emerald-500/20 border-2 border-emerald-500 p-5 rounded-2xl text-emerald-300 font-bold text-sm mb-6 animate-pulse flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
              <span className="flex items-center gap-2 text-lg text-emerald-400 font-black">
                <CheckCircle size={24} /> AKSES UJIAN TELAH DIPULIHKAN!
              </span>
              <span className="text-xs font-medium text-emerald-100 leading-relaxed">
                Admin / Pengawas telah membuka kunci ujian Anda. Semua jawaban sebelumnya tersimpan aman. Klik tombol di bawah untuk langsung melanjutkan ujian tanpa perlu reload halaman!
              </span>
            </div>
          ) : (
            <p className="text-amber-400 font-semibold text-sm mb-6 bg-amber-950/60 p-3 rounded-xl border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
              Pelanggaran Ke-5 Terdeteksi! Layar terkunci sementara. Silakan minta buka kunci kepada Admin atau Pengawas.
            </p>
          )}

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-left text-xs text-slate-300 space-y-2 mb-6">
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Siswa:</span>
              <span className="font-bold text-white">{loggedStudent?.name} ({loggedStudent?.class})</span>
            </div>
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Penyebab Terkunci:</span>
              <span className="font-bold text-amber-400">{suspensionReason || loggedStudent?.lastViolationReason || 'Pelanggaran Ke-5'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700/60 pb-2">
              <span className="text-slate-400">Total Pelanggaran:</span>
              <span className="font-bold text-red-400">{loggedStudent?.violationCount || 5} Kali (Terkunci Sementara)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Jawaban:</span>
              <span className="font-bold text-emerald-400">Tersimpan Utuh (Siap Dilanjutkan Setelah Dibuka)</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs text-left mb-6 leading-relaxed flex items-start gap-3">
            <Lock size={20} className="flex-shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <p className="font-bold mb-1">Cara Melanjutkan Ujian:</p>
              1. <strong>Otomatis dari Admin / Pengawas:</strong> Begitu Admin atau Pengawas menekan "Buka Kunci" di Dashboard, tombol hijau muncul di layar ini.<br/>
              2. <strong>PIN Admin / Pengawas di Tempat:</strong> Admin atau Pengawas memasukkan PIN Buka Kunci di perangkat ini.<br/>
              3. <strong>Setelah Dibuka:</strong> Anda dapat melanjutkan mengerjakan soal. Jika terjadi pelanggaran lagi, tetap diberikan peringatan namun layar tidak akan terkunci lagi.
            </div>
          </div>

          <div className="space-y-3">
            {isUnlockedByTeacher ? (
              <button 
                onClick={() => resumeExamForStudent()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-4 rounded-xl text-sm transition-all shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2 animate-bounce cursor-pointer"
              >
                <CheckCircle size={22} /> LANJUTKAN MENGERJAKAN SOAL SEKARANG
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const currentInDb = students.find(s => s.id === loggedStudent?.id);
                    if (currentInDb && currentInDb.examAllowed && (currentInDb.status === 'active' || currentInDb.status === 'idle')) {
                      resumeExamForStudent(currentInDb);
                    } else {
                      showToast("Menunggu Admin / Pengawas membuka kunci di Dashboard...");
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  <RefreshCw size={16} className="mr-1.5 animate-spin"/> Minta Buka Kunci / Cek Status
                </button>

                <button 
                  onClick={() => {
                    setShowTeacherPinModal(true);
                    setTeacherPinInput('');
                    setPinError('');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Key size={16} className="mr-1.5"/> Input PIN Admin / Pengawas
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => {
                  setRole('student_login');
                  setLoggedStudent(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={16} /> Logout & Login Ulang
              </button>

              <button 
                onClick={() => {
                  setRole('selection');
                  setLoggedStudent(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Halaman Awal
              </button>
            </div>
          </div>
        </div>

        {/* Modal PIN Buka Kunci */}
        {showTeacherPinModal && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Lock size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Verifikasi PIN Buka Kunci</h3>
              <p className="text-slate-400 text-xs mb-4">Masukkan PIN Buka Kunci dari Admin atau Pengawas</p>

              {pinError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-xs mb-4 flex items-center justify-center">
                  <AlertCircle size={14} className="mr-1 flex-shrink-0" /> {pinError}
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                const inputClean = teacherPinInput.trim();
                const isValid = 
                  inputClean === unlockPin || 
                  staffUsers.some(u => (u.role === 'admin' || u.role === 'pengawas') && u.password === inputClean);

                if (isValid) {
                  setShowTeacherPinModal(false);
                  if (loggedStudent) {
                    await unlockStudentExam(loggedStudent.id);
                    resumeExamForStudent();
                  }
                } else {
                  setPinError('PIN / Password Buka Kunci Salah! Masukkan PIN Admin atau Password Pengawas.');
                }
              }} className="space-y-4">
                <input 
                  type="password"
                  required
                  autoFocus
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-amber-300 font-mono text-xl tracking-widest outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="PIN Admin / Password Pengawas"
                  value={teacherPinInput}
                  onChange={e => {
                    setTeacherPinInput(e.target.value);
                    if(pinError) setPinError('');
                  }}
                />

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowTeacherPinModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 cursor-pointer"
                  >
                    Buka Kunci
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (role === 'teacher_auth') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <button 
            onClick={() => {
              setRole('selection');
              setPasswordError('');
              setStaffLoginInput({ username: '', password: '' });
            }} 
            className="text-slate-400 hover:text-white mb-6 flex items-center text-sm font-medium cursor-pointer"
          >
            <ChevronLeft size={16} className="mr-1"/> Kembali
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Portal Staf CBT</h2>
            <p className="text-slate-400 text-xs mt-1">Masuk sebagai Administrator, Guru, atau Pengawas Ujian</p>
          </div>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs mb-4 flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            const trimmedUser = staffLoginInput.username.trim().toLowerCase();
            const trimmedPass = staffLoginInput.password.trim();

            if (!trimmedUser || !trimmedPass) {
              setPasswordError('Username dan Kata Sandi wajib diisi!');
              return;
            }

            // Validasi pengguna staf dari database Manajemen User
            const foundStaff = staffUsers.find(
              u => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
            );

            if (foundStaff) {
              setCurrentStaffUser(foundStaff);
              setRole('teacher_dashboard');
              setPasswordError('');
              if (foundStaff.role === 'guru') setTeacherTab('bank_soal');
              else if (foundStaff.role === 'pengawas') setTeacherTab('controls');
              else setTeacherTab('submissions');
            } else if (trimmedUser === 'admin' && (trimmedPass === 'admin123' || trimmedPass === 'khoirul91' || trimmedPass === 'admin')) {
              const adminUser = staffUsers.find(u => u.role === 'admin') || INITIAL_STAFF_USERS[0];
              setCurrentStaffUser(adminUser);
              setRole('teacher_dashboard');
              setPasswordError('');
              setTeacherTab('submissions');
            } else {
              setPasswordError('Username atau kata sandi salah! Akses ditolak.');
            }
          }} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Username Staf</label>
              <input 
                type="text" 
                required
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                placeholder="Masukkan username..."
                value={staffLoginInput.username}
                onChange={e => {
                  setStaffLoginInput({ ...staffLoginInput, username: e.target.value });
                  if(passwordError) setPasswordError('');
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Kata Sandi</label>
              <input 
                type="password" 
                required
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                placeholder="Masukkan kata sandi..."
                value={staffLoginInput.password}
                onChange={e => {
                  setStaffLoginInput({ ...staffLoginInput, password: e.target.value });
                  if(passwordError) setPasswordError('');
                }}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl mt-3 transition-colors flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer text-xs"
            >
              Masuk ke Dashboard Staf <ChevronRight size={18} className="ml-1" />
            </button>
          </form>

          {/* Catatan Keamanan Autentikasi Pengguna */}
          <div className="mt-6 pt-4 border-t border-slate-700/80 text-xs text-slate-400 bg-slate-900/60 p-3.5 rounded-xl text-center">
            <span className="font-semibold text-slate-300 block mb-1">🔐 Autentikasi Pengguna Aktif</span>
            <span className="text-[11px] text-slate-400 leading-relaxed block">
              Setiap pengguna (Admin, Guru, Pengawas) wajib memasukkan username dan kata sandi yang terdaftar di Manajemen User untuk dapat mengakses sistem.
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'student_login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <button onClick={() => setRole('selection')} className="text-slate-400 hover:text-white mb-6 flex items-center text-sm font-medium cursor-pointer">
            <ChevronLeft size={16} className="mr-1"/> Kembali
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <UserCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Login Siswa CBT</h2>
            <p className="text-slate-400 text-sm mt-1">Masukkan Username & Password Akun Siswa</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm mb-4 flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Username</label>
              <input 
                type="text" 
                required
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: siswa1"
                value={loginInput.username}
                onChange={e => setLoginInput({ ...loginInput, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase">Password</label>
              <input 
                type="password" 
                required
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan password Anda..."
                value={loginInput.password}
                onChange={e => setLoginInput({ ...loginInput, password: e.target.value })}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl mt-4 transition-colors flex items-center justify-center shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Lanjut Masuk <ChevronRight size={20} className="ml-1" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/80 text-xs text-slate-400 bg-slate-900/50 p-3.5 rounded-xl">
            <span className="font-semibold text-slate-300 block mb-1">💡 Petunjuk Login Siswa:</span>
            <span>Gunakan <strong>Nomor NISN</strong> Anda sebagai Username & Password (contoh: <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">10680</code>)</span>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'student_token') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-700">
          <button 
            onClick={() => {
              setRole('student_login');
              setLoggedStudent(null);
            }} 
            className="text-slate-400 hover:text-white mb-6 flex items-center text-sm font-medium cursor-pointer"
          >
            <ChevronLeft size={16} className="mr-1"/> Keluar Akun
          </button>
          
          <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {loggedStudent?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white">{loggedStudent?.name}</h3>
              <p className="text-xs text-slate-400">Kelas: {loggedStudent?.class} • @{loggedStudent?.username}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${loggedStudent?.examAllowed ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                  {loggedStudent?.examAllowed ? 'Izin Ujian: Diberikan' : 'Izin Ujian: Diblokir'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
              <Key size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Token Ujian CBT</h2>
            <p className="text-slate-400 text-xs mt-1">Pilih paket ujian aktif di bawah atau masukkan Token resmi dari Pengawas</p>
          </div>

          {/* Filtered Active Exam Packages Quick Selector */}
          {(() => {
            const studentEligibleExams = examPackages.filter(e => isExamEligibleForStudent(e, loggedStudent));

            if (studentEligibleExams.length === 0) {
              return (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-2xl text-xs mb-5 flex items-start gap-3">
                  <ShieldAlert size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-bold text-sm text-amber-200">Tidak Ada Paket Ujian Aktif</p>
                    <p className="text-slate-300 mt-1 leading-relaxed">
                      Saat ini belum ada Paket Ujian aktif yang ditugaskan untuk kelas <span className="font-bold text-white">"{loggedStudent?.class || '-'}"</span> atau khusus untuk akun Anda.
                    </p>
                    <p className="text-slate-400 text-[11px] mt-2 border-t border-amber-500/20 pt-2">
                      💡 Silakan hubungi Admin Ujian untuk membuka Sesi Ujian bagi kelas Anda.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="mb-5 space-y-2 text-left">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>📌 Pilih Paket Ujian Ditugaskan ({studentEligibleExams.length}):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kelas: {loggedStudent?.class}</span>
                </label>
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {studentEligibleExams.map(exam => {
                    const pkg = questionPackages.find(p => p.id === exam.questionPackageId);
                    const isSelected = tokenInput === exam.token;
                    return (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => {
                          setTokenInput(exam.token);
                          setTokenError('');
                        }}
                        className={`w-full p-3.5 text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 text-amber-200'
                            : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-indigo-950">
                              {exam.subjectName || pkg?.subject || 'Mata Pelajaran'}
                            </span>
                            <span className="text-[10px] text-slate-400">Target: {exam.targetClass}</span>
                          </div>
                          <p className="font-bold text-xs text-white leading-snug">{exam.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Durasi: <span className="font-semibold text-slate-200">{exam.durationMinutes} Menit</span> • {pkg?.questions?.length || 0} Soal
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="font-mono font-bold text-xs bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">
                            {exam.token}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
                              ✓ Terpilih
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {tokenError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm mb-4 flex items-start">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase text-center">TOKEN UJIAN</label>
              <input 
                type="text" 
                required
                maxLength={10}
                className="w-full p-4 bg-slate-900 border-2 border-amber-500/50 rounded-xl text-amber-300 font-mono text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                placeholder="TOKEN"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value.toUpperCase())}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              Mulai Mengerjakan <ChevronRight size={20} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (role === 'student_exam') {
    return (
      <>
        <StudentExamView 
            loggedStudent={loggedStudent}
            questions={questions}
            currentQuestionIdx={currentQuestionIdx}
            setCurrentQuestionIdx={setCurrentQuestionIdx}
            answers={answers}
            handleAnswerSelect={handleAnswerSelect}
            doubtfulAnswers={doubtfulAnswers}
            toggleDoubtful={toggleDoubtful}
            fontSize={fontSize}
            setFontSize={setFontSize}
            timeLeft={timeLeft}
            formatTime={formatTime}
            violationWarning={violationWarning}
            setViolationWarning={setViolationWarning}
            setShowConfirmModal={setShowConfirmModal}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
            isExamActiveGlobal={isExamActiveGlobal}
          />

        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 text-center border border-slate-100">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <AlertCircle size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Pengumpulan</h3>
              
              {Object.keys(answers).length < questions.length ? (
                <p className="text-slate-600 mb-6 text-xs sm:text-sm leading-relaxed">
                  Anda baru menjawab <strong>{Object.keys(answers).length}</strong> dari <strong>{questions.length}</strong> soal.<br/><br/>
                  Soal yang belum dijawab otomatis dianggap salah. Yakin ingin mengumpulkan?
                </p>
              ) : (
                <p className="text-slate-600 mb-6 text-xs sm:text-sm leading-relaxed">
                  Anda telah menjawab semua {questions.length} soal. Apakah Anda yakin ingin menyelesaikan ujian sekarang?
                </p>
              )}

              <div className="flex gap-2.5">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleFinishExam();
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Ya, Kumpulkan
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (role === 'student_result') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <style>{`
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden, header, nav, button { display: none !important; }
            .print\\:block { display: block !important; }
            .shadow-xl, .shadow-2xl, .shadow-md { box-shadow: none !important; }
            @page { size: A4; margin: 1.5cm; }
          }
        `}</style>
        <div id="student-exam-result-card" className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-100">
          {forcedSubmitNotice ? (
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-300">
              <ShieldAlert size={48} />
            </div>
          ) : (
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} />
            </div>
          )}

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {forcedSubmitNotice ? 'Ujian Dihentikan Paksa!' : 'Ujian Selesai!'}
          </h2>
          
          <p className="text-slate-500 mb-6 text-sm">
            {forcedSubmitNotice 
              ? 'Terdeteksi pelanggaran 3 kali berturut-turut. Ujian otomatis ditutup.' 
              : 'Jawaban Anda telah berhasil dikirimkan ke server CBT.'}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6 text-left print:border-slate-300">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Ringkasan Hasil Ujian Fisika</h3>
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600 font-medium">Nama</span>
              <span className="text-slate-800 font-bold">{loggedStudent?.name}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600 font-medium">Kelas</span>
              <span className="text-slate-800 font-bold">{loggedStudent?.class}</span>
            </div>
            <div className="w-full h-px bg-slate-200 my-4"></div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Jawaban Benar</span>
              <span className="text-green-600 font-bold">{finalScore?.correctCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Jawaban Salah</span>
              <span className="text-red-500 font-bold">{finalScore?.wrongCount}</span>
            </div>
            <div className="flex justify-between items-center text-lg mt-3 pt-3 border-t">
              <span className="text-slate-700 font-bold">Nilai Akhir</span>
              <span className="text-indigo-600 font-black text-2xl">{finalScore?.score}</span>
            </div>
          </div>

          <div className="flex gap-2 print:hidden">
            <button 
              onClick={() => handleDownloadPdf('student-exam-result-card', `Hasil_Ujian_${loggedStudent?.name?.replace(/\s+/g, '_') || 'Siswa'}.pdf`)}
              disabled={isGeneratingPDF}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Printer size={18}/> {isGeneratingPDF ? 'Memproses...' : 'Cetak PDF'}
            </button>
            <button 
              onClick={() => {
                setRole('selection');
                setLoggedStudent(null);
                setForcedSubmitNotice(false);
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            >
              <LogOut size={18} className="mr-2"/> Ke Awal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'teacher_dashboard') {
    const uniqueStudentClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }));
    const uniqueSubmissionClasses = Array.from(new Set(submissions.map(s => s.studentClass).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'id', { numeric: true }));

    const filteredStudentsList = getFilteredStudents();
    const filteredSubmissionsList = getFilteredSubmissions();

    const totalStudentPages = Math.max(1, Math.ceil(filteredStudentsList.length / (studentPerPage || 50)));
    const validStudentPage = Math.min(Math.max(1, studentPage), totalStudentPages);
    const displayedStudents = studentPerPage === 0 
      ? filteredStudentsList 
      : filteredStudentsList.slice((validStudentPage - 1) * studentPerPage, validStudentPage * studentPerPage);

    return (
      <div className="min-h-screen bg-slate-100 font-sans pb-10 relative">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-bounce flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="bg-indigo-900 text-white shadow-md print:hidden">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-800 border border-indigo-600/50 flex items-center justify-center font-bold text-white shadow-xs text-lg">
                {currentStaffUser?.role === 'admin' ? '👑' : currentStaffUser?.role === 'guru' ? '📘' : '🛡️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight">
                    {currentStaffUser?.role === 'admin' 
                      ? 'Dashboard Administrator CBT' 
                      : currentStaffUser?.role === 'guru' 
                        ? 'Portal Guru Pengampu Soal' 
                        : 'Portal Pengawas Ujian Ruang'}
                  </h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                    currentStaffUser?.role === 'admin' 
                      ? 'bg-amber-400 text-indigo-950' 
                      : currentStaffUser?.role === 'guru' 
                        ? 'bg-emerald-400 text-indigo-950' 
                        : 'bg-blue-300 text-indigo-950'
                  }`}>
                    {currentStaffUser?.role === 'admin' ? 'Akses Penuh' : currentStaffUser?.role === 'guru' ? `Guru ${currentStaffUser.subject || ''}` : 'Pengawas'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Pengguna: <strong className="text-white">{currentStaffUser?.name || 'Staf'}</strong> • SMAN 1 TOILI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setRole('selection');
                  setCurrentStaffUser(null);
                }}
                className="bg-red-500/90 hover:bg-red-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-colors shadow-xs cursor-pointer border border-red-400/50"
              >
                <LogOut size={14} className="mr-1.5"/> Ganti Akun / Keluar
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 flex space-x-2 border-t border-indigo-800/80 pt-2 overflow-x-auto">
            {/* Tab: Hasil Ujian (All Roles) */}
            <button
              onClick={() => setTeacherTab('submissions')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                teacherTab === 'submissions'
                  ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                  : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
              }`}
            >
              <FileText size={16} /> Hasil Ujian & Arsip ({submissions.length})
            </button>

            {/* Tab: Database Siswa (Admin & Pengawas) */}
            {(currentStaffUser?.role === 'admin' || currentStaffUser?.role === 'pengawas') && (
              <button
                onClick={() => setTeacherTab('students')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'students'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <Users size={16} /> Database Siswa ({students.length})
                {students.some(s => s.status === 'active') && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-emerald-500 text-white rounded-full font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    {students.filter(s => s.status === 'active').length}
                  </span>
                )}
                {students.some(s => s.status === 'paused') && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-500 text-white rounded-full font-extrabold">
                    {students.filter(s => s.status === 'paused').length} Dijeda
                  </span>
                )}
              </button>
            )}

            {/* Tab: Paket Ujian (Admin & Guru) */}
            {(currentStaffUser?.role === 'admin' || currentStaffUser?.role === 'guru') && (
              <button
                onClick={() => setTeacherTab('paket_ujian')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'paket_ujian'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <Layers size={16} /> Paket Ujian ({examPackages.length})
              </button>
            )}

            {/* Tab: Bank Soal (Admin & Guru) */}
            {(currentStaffUser?.role === 'admin' || currentStaffUser?.role === 'guru') && (
              <button
                onClick={() => setTeacherTab('bank_soal')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'bank_soal'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <BookOpen size={16} /> Bank Soal ({questionPackages.length} Paket)
              </button>
            )}

            {/* Tab: Anti-Kecurangan (Admin & Pengawas) */}
            {(currentStaffUser?.role === 'admin' || currentStaffUser?.role === 'pengawas') && (
              <button
                onClick={() => setTeacherTab('violations')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all relative cursor-pointer ${
                  teacherTab === 'violations'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <ShieldAlert size={16} /> Anti-Kecurangan
                {students.some(s => s.status === 'suspended') && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-red-500 text-white rounded-full animate-pulse font-extrabold">
                    {students.filter(s => s.status === 'suspended').length} Terkunci
                  </span>
                )}
              </button>
            )}

            {/* Tab: Kontrol & Token Ujian (Admin & Pengawas) */}
            {(currentStaffUser?.role === 'admin' || currentStaffUser?.role === 'pengawas') && (
              <button
                onClick={() => setTeacherTab('controls')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'controls'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <ShieldCheck size={16} /> Kontrol & Token Ujian
              </button>
            )}

            {/* Tab: Pengaturan User Guru & Pengawas (Admin Only) */}
            {currentStaffUser?.role === 'admin' && (
              <button
                onClick={() => setTeacherTab('staff_users')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'staff_users'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <Users size={16} /> Pengaturan User (Guru & Pengawas)
              </button>
            )}

            {/* Tab: Master Data Mata Pelajaran (Admin Only) */}
            {currentStaffUser?.role === 'admin' && (
              <button
                onClick={() => setTeacherTab('subjects')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'subjects'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-amber-300 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <BookOpen size={16} /> Mata Pelajaran ({subjects.length})
              </button>
            )}

            {/* Tab: Database Cloudflare D1 (Admin Only) */}
            {currentStaffUser?.role === 'admin' && (
              <button
                onClick={() => setTeacherTab('cloudflare')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  teacherTab === 'cloudflare'
                    ? 'border-white text-white bg-indigo-950/60 rounded-t-lg'
                    : 'border-transparent text-orange-300 hover:text-white hover:bg-indigo-800/50 rounded-t-lg'
                }`}
              >
                <Cloud size={16} /> Database Cloudflare (D1)
              </button>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 mt-6">

          {/* TAB 1: HASIL UJIAN & ARSIP PER MATA PELAJARAN DAN KELAS */}
          {teacherTab === 'submissions' && (
            <div className={`space-y-6 ${viewingDetail ? 'print:hidden' : ''}`}>
              <ExamArchiveView 
                submissions={submissions}
                questionPackages={questionPackages}
                examPackages={examPackages}
                students={students}
                staffRole={currentStaffUser?.role || 'admin'}
                currentSubject={currentStaffUser?.subject}
                isGeneratingPDF={isGeneratingPDF}
                onDownloadPdf={handleDownloadPdf}
                onViewDetail={setViewingDetail}
                onDeleteSubmission={currentStaffUser?.role === 'admin' ? handleDeleteSubmission : undefined}
              />
            </div>
          )}

          {/* TAB 2: DATABASE SISWA */}
          {teacherTab === 'students' && (
            <div className={`space-y-6 ${showStudentCardModal ? 'print:hidden' : ''}`}>
              {/* Real-time Status Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Mengerjakan</p>
                    <p className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'active').length}</p>
                    <p className="text-[10px] text-slate-400">Sync Real-time</p>
                  </div>
                  <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                    <Play size={18} className="fill-emerald-600" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Ujian Dijeda</p>
                    <p className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'paused').length}</p>
                    <p className="text-[10px] text-slate-400">Waktu Ditahan</p>
                  </div>
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                    <Clock size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Terkunci (5x)</p>
                    <p className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'suspended').length}</p>
                    <p className="text-[10px] text-slate-400">Butuh Buka Kunci</p>
                  </div>
                  <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
                    <Lock size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Selesai Ujian</p>
                    <p className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'completed' || s.status === 'force_submitted').length}</p>
                    <p className="text-[10px] text-slate-400">Tersimpan di Hasil</p>
                  </div>
                  <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <CheckCircle size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Belum Masuk</p>
                    <p className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'idle' || !s.status).length}</p>
                    <p className="text-[10px] text-slate-400">Menunggu Login</p>
                  </div>
                  <div className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                    <Clock size={18} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari nama / kelas / username..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                  </div>

                  {/* Grade Filter */}
                  <div className="flex items-center gap-1.5">
                    <Filter size={15} className="text-slate-500 shrink-0" />
                    <select
                      value={studentGradeFilter}
                      onChange={e => {
                        setStudentGradeFilter(e.target.value);
                        setStudentPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Tingkat</option>
                      <option value="X">Kelas X</option>
                      <option value="XI">Kelas XI</option>
                      <option value="XII">Kelas XII</option>
                    </select>
                  </div>

                  {/* Class Filter */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={studentClassFilter}
                      onChange={e => {
                        setStudentClassFilter(e.target.value);
                        setStudentPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="ALL">Semua Kelas ({students.length})</option>
                      {uniqueStudentClasses.map(cls => (
                        <option key={cls} value={cls}>
                          Kelas {cls} ({students.filter(s => s.class === cls).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={15} className="text-slate-500 shrink-0" />
                    <select
                      value={studentSortBy}
                      onChange={e => setStudentSortBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="class_asc">Urut Kelas & Nama</option>
                      <option value="name_asc">Nama Siswa (A - Z)</option>
                      <option value="name_desc">Nama Siswa (Z - A)</option>
                      <option value="status">Status Ujian</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {students.some(s => s.status === 'active') && (
                    <button
                      onClick={forceSubmitAllActiveStudents}
                      className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      <Power size={15} className="mr-1.5"/> Paksa Kumpulkan Semua Active
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={downloadStudentTemplate}
                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                    title="Unduh format template Excel/CSV untuk diisi sebelum diunggah"
                  >
                    <Download size={15} className="mr-1.5 text-emerald-600"/> Download Template Siswa
                  </button>

                  <button 
                    onClick={exportStudentsToCSV}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Download size={15} className="mr-1.5"/> Export CSV
                  </button>

                  <button 
                    onClick={() => setShowStudentCardModal(true)}
                    className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Printer size={15} className="mr-1.5"/> Cetak Kartu Peserta
                  </button>

                  {currentStaffUser?.role === 'admin' && (
                    <>
                      <button 
                        onClick={() => {
                          setShowImportModal(true);
                          setImportError('');
                          setImportSuccessMsg('');
                          setImportText('');
                          setImportPreviewData([]);
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet size={16} className="mr-1.5"/> Upload / Import Siswa
                      </button>

                      <button 
                        onClick={() => {
                          setShowAddStudentModal(true);
                          setAddStudentError('');
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Plus size={16} className="mr-1.5"/> Tambah Siswa Baru
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedStudentIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                  <span className="text-indigo-900 font-bold text-xs flex items-center gap-2">
                    <CheckCircle size={16} className="text-indigo-600" />
                    {selectedStudentIds.length} Siswa Terpilih
                  </span>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={handleBulkPauseStudents}
                      title="Jeda ujian untuk siswa terpilih yang sedang aktif"
                      className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Clock size={13} /> Jeda Ujian ({selectedStudentIds.length})
                    </button>
                    <button 
                      onClick={handleBulkResumeStudents}
                      title="Lanjutkan ujian untuk siswa terpilih yang dijeda atau terkunci"
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play size={13} /> Lanjutkan ({selectedStudentIds.length})
                    </button>
                    <button 
                      onClick={handleBulkForceSubmitStudents}
                      title="Hentikan ujian untuk siswa terpilih dan kumpulkan jawaban sekarang"
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Power size={13} /> Hentikan Ujian ({selectedStudentIds.length})
                    </button>
                    <button 
                      onClick={() => handleBulkToggleAccess(true)}
                      className="px-2.5 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shadow-xs cursor-pointer"
                    >
                      Izinkan
                    </button>
                    <button 
                      onClick={() => handleBulkToggleAccess(false)}
                      className="px-2.5 py-1.5 bg-slate-500 text-white text-xs font-bold rounded-lg hover:bg-slate-600 shadow-xs cursor-pointer"
                    >
                      Blokir
                    </button>
                    {currentStaffUser?.role === 'admin' && (
                      <button 
                        onClick={() => setDeleteConfirmTarget('bulk')}
                        className="px-2.5 py-1.5 bg-red-700 text-white text-xs font-bold rounded-lg hover:bg-red-800 shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13}/> Hapus
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800">Daftar Akun Siswa ({filteredStudentsList.length})</h3>
                    <p className="text-xs text-slate-400">Status pengerjaan & jawaban siswa tersinkronisasi secara real-time</p>
                  </div>
                  {(studentSearch || studentGradeFilter !== 'ALL' || studentClassFilter !== 'ALL') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                        Filter: {studentGradeFilter !== 'ALL' ? `Tingkat ${studentGradeFilter}` : ''} {studentClassFilter !== 'ALL' ? `Kelas ${studentClassFilter}` : ''} {studentSearch ? `"${studentSearch}"` : ''}
                      </span>
                      <button
                        onClick={() => { 
                          setStudentSearch(''); 
                          setStudentGradeFilter('ALL');
                          setStudentClassFilter('ALL'); 
                          setStudentPage(1);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-4 border-b text-center">
                          <input 
                            type="checkbox" 
                            onChange={handleSelectAllStudents}
                            checked={
                              filteredStudentsList.length > 0 && 
                              filteredStudentsList.every(s => selectedStudentIds.includes(s.id))
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-4 border-b">No</th>
                        <th className="px-6 py-4 border-b">Nama Siswa</th>
                        <th className="px-6 py-4 border-b">Kelas</th>
                        <th className="px-6 py-4 border-b">Username</th>
                        <th className="px-6 py-4 border-b">Password</th>
                        <th className="px-6 py-4 border-b text-center">Status & Progress Real-Time</th>
                        <th className="px-6 py-4 border-b text-center">Akses Ujian</th>
                        <th className="px-6 py-4 border-b text-center">Aksi Pengelolaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {displayedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                            Tidak ada siswa yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        displayedStudents.map((std, idx) => {
                          const isSelected = selectedStudentIds.includes(std.id);
                          const answeredCount = Object.keys(std.savedAnswers || {}).length;
                          const itemIndex = studentPerPage === 0 ? idx + 1 : (validStudentPage - 1) * studentPerPage + idx + 1;

                          return (
                            <tr key={std.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                              <td className="px-4 py-4 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectStudent(std.id)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                              </td>
                              <td className="px-4 py-4 text-slate-400 font-mono text-xs">{itemIndex}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{std.name}</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{std.class}</td>
                              <td className="px-6 py-4 font-mono text-indigo-600 font-semibold bg-indigo-50/50 px-2 py-1 rounded inline-block my-2 text-xs">@{std.username}</td>
                              <td className="px-6 py-4 font-mono text-slate-700 text-xs">{std.password}</td>
                              <td className="px-6 py-4 text-center">
                                {std.status === 'active' && (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-extrabold border border-emerald-200 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span> Sedang Mengerjakan
                                    </span>
                                    <span className="text-[11px] text-indigo-600 font-bold mt-1">
                                      {answeredCount}/{questions.length} Soal • {formatTime(std.savedTimeLeft || TOTAL_TIME_SECONDS)}
                                    </span>
                                  </div>
                                )}
                                {std.status === 'paused' && (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-[11px] font-extrabold border border-amber-300 flex items-center gap-1.5 animate-pulse">
                                      <Clock size={12} className="text-amber-700" /> Ujian Dijeda
                                    </span>
                                    <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                      Waktu ditahan ({formatTime(std.savedTimeLeft || TOTAL_TIME_SECONDS)})
                                    </span>
                                  </div>
                                )}
                                {std.status === 'suspended' && (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-extrabold border border-amber-300 animate-pulse flex items-center gap-1">
                                      <Lock size={12} /> Terkunci ({std.violationCount || 0}x)
                                    </span>
                                    {std.lastViolationReason && (
                                      <span className="text-[10px] text-red-600 font-semibold mt-0.5 max-w-[140px] truncate" title={std.lastViolationReason}>
                                        {std.lastViolationReason}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {(std.status === 'completed' || std.status === 'force_submitted') && (
                                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold border border-blue-200">
                                    {std.status === 'force_submitted' ? 'Gugur / Diselesaikan' : 'Selesai Ujian'}
                                  </span>
                                )}
                                {(std.status === 'idle' || !std.status) && (
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium border border-slate-200">
                                    Belum Masuk
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  std.examAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {std.examAllowed ? 'Diberikan Izin' : 'Diblokir'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {std.status === 'suspended' && (
                                    <>
                                      <button 
                                        onClick={() => unlockStudentExam(std.id)}
                                        title="Buka Kunci Siswa Ini"
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Unlock size={14}/> Buka
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                            forceSubmitStudentExam(std.id);
                                          }
                                        }}
                                        title="Hentikan Ujian Siswa Terkunci Ini"
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Power size={13}/> Stop
                                      </button>
                                    </>
                                  )}

                                  {std.status === 'active' && (
                                    <>
                                      <button 
                                        onClick={() => pauseStudentExam(std.id)}
                                        title="Jeda Ujian Siswa Ini (Waktu Ditahan)"
                                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Clock size={13} /> Jeda
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                            forceSubmitStudentExam(std.id);
                                          }
                                        }}
                                        title="Hentikan Ujian Siswa Ini Sekarang"
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Power size={13}/> Stop
                                      </button>
                                      <button 
                                        onClick={() => addExtraTime(std.id, 300)}
                                        title="Tambah Waktu 5 Menit"
                                        className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold hover:bg-indigo-100 cursor-pointer"
                                      >
                                        +5m
                                      </button>
                                    </>
                                  )}

                                  {std.status === 'paused' && (
                                    <>
                                      <button 
                                        onClick={() => resumeStudentExam(std.id)}
                                        title="Lanjutkan Ujian Siswa Ini"
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Play size={13} /> Lanjut
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                            forceSubmitStudentExam(std.id);
                                          }
                                        }}
                                        title="Hentikan Ujian Siswa Ini Sekarang"
                                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                      >
                                        <Power size={13}/> Stop
                                      </button>
                                    </>
                                  )}

                                  {(std.status === 'active' || std.status === 'suspended' || std.status === 'completed' || std.status === 'force_submitted') && (
                                    <button 
                                      onClick={() => handleResetStudentExam(std.id)}
                                      title="Reset Sesi Ujian Siswa"
                                      className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <RotateCcw size={14}/>
                                    </button>
                                  )}

                                  <button 
                                    onClick={() => toggleStudentAccess(std.id)}
                                    title={std.examAllowed ? 'Blokir Akses' : 'Izinkan Akses'}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      std.examAllowed 
                                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {std.examAllowed ? <UserX size={15}/> : <CheckCircle size={15}/>}
                                  </button>

                                  <button 
                                    onClick={() => {
                                      setEditingStudent({ ...std });
                                      setEditStudentError('');
                                    }}
                                    title="Edit Siswa"
                                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Edit size={15} />
                                  </button>

                                  <button 
                                    onClick={() => confirmDeleteSingleStudent(std)}
                                    title="Hapus Siswa"
                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for 700 Students */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      Menampilkan <strong>{filteredStudentsList.length === 0 ? 0 : (validStudentPage - 1) * (studentPerPage || filteredStudentsList.length) + 1} - {Math.min(validStudentPage * (studentPerPage || filteredStudentsList.length), filteredStudentsList.length)}</strong> dari <strong>{filteredStudentsList.length}</strong> Siswa
                    </span>
                    <span className="text-slate-300">|</span>
                    <label className="flex items-center gap-1 font-medium">
                      Baris Per Halaman:
                      <select
                        value={studentPerPage}
                        onChange={(e) => {
                          setStudentPerPage(Number(e.target.value));
                          setStudentPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={0}>Semua ({filteredStudentsList.length})</option>
                      </select>
                    </label>
                  </div>

                  {studentPerPage > 0 && totalStudentPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setStudentPage(prev => Math.max(1, prev - 1))}
                        disabled={validStudentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={14} /> Sebelumnya
                      </button>

                      <span className="px-3 py-1.5 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
                        Halaman {validStudentPage} dari {totalStudentPages}
                      </span>

                      <button
                        onClick={() => setStudentPage(prev => Math.min(totalStudentPages, prev + 1))}
                        disabled={validStudentPage === totalStudentPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      >
                        Selanjutnya <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAKET UJIAN */}
          {teacherTab === 'paket_ujian' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Layers size={22} className="text-indigo-600" />
                    Manajemen Paket Ujian (ANBK & OSN Style)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur jadwal & sesi ujian aktif dengan menghubungkan Paket Soal ke Target Kelas tertentu.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {currentStaffUser?.role === 'admin' && (
                    <button
                      onClick={() => setShowSubjectModal(true)}
                      className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Kelola Master Data Mata Pelajaran"
                    >
                      <BookOpen size={16} /> Kelola Mapel ({subjects.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingExamPackage(null);
                      setShowExamPackageModal(true);
                    }}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Plus size={18} /> Buat Paket Ujian Baru
                  </button>
                </div>
              </div>

              {/* Grid of Exam Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {examPackages.map((exam) => {
                  const linkedPkg = questionPackages.find(p => p.id === exam.questionPackageId);
                  const qCount = linkedPkg?.questions?.length || 0;

                  return (
                    <div 
                      key={exam.id}
                      className={`bg-white rounded-2xl border transition-all p-6 shadow-xs flex flex-col justify-between ${
                        exam.isActive ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 opacity-85'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <span className="px-3 py-1 rounded-lg font-extrabold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Kelas: {exam.targetClass}
                          </span>
                          <button
                            onClick={() => handleToggleExamPackage(exam.id, exam.isActive)}
                            className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                              exam.isActive
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${exam.isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                            {exam.isActive ? 'AKTIF' : 'NONAKTIF'}
                          </button>
                        </div>

                        <h4 className="font-extrabold text-slate-800 text-base mb-1">{exam.title}</h4>
                        <p className="text-xs text-indigo-600 font-bold mb-3">{exam.subjectName}</p>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Paket Soal:</span>
                            <span className="font-bold text-slate-700 truncate max-w-[150px]">{linkedPkg?.title || 'Paket tidak ditemukan'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Jumlah Soal:</span>
                            <span className="font-bold text-slate-800">{qCount} Soal</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Durasi Ujian:</span>
                            <span className="font-bold text-slate-800">{exam.durationMinutes} Menit</span>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-amber-700">TOKEN UJIAN</span>
                            <span className="font-mono font-black text-amber-900 text-lg tracking-wider">{exam.token}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(exam.token);
                              showToast(`Token "${exam.token}" disalin!`);
                            }}
                            className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            title="Salin Token"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setEditingExamPackage(exam);
                            setShowExamPackageModal(true);
                          }}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit size={14} /> Edit Paket
                        </button>
                        <button
                          onClick={() => handleDeleteExamPackage(exam.id)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Hapus Paket Ujian"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BANK SOAL */}
          {teacherTab === 'bank_soal' && (() => {
            const currentPackage = questionPackages.find(p => p.id === selectedPackageId) || questionPackages[0];
            const currentQuestions = currentPackage?.questions || questions;

            return (
              <div className="space-y-6">
                {/* Header Package Selector */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1.5">PILIH PAKET SOAL</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {questionPackages.map(pkg => (
                          <button
                            key={pkg.id}
                            onClick={() => {
                              setSelectedPackageId(pkg.id);
                              setQuestions(pkg.questions || []);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                              selectedPackageId === pkg.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <BookOpen size={14} />
                            <span>{pkg.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              selectedPackageId === pkg.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {pkg.questions?.length || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {currentStaffUser?.role === 'admin' && (
                        <button
                          onClick={() => setShowSubjectModal(true)}
                          className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                          title="Kelola Master Data Mata Pelajaran"
                        >
                          <BookOpen size={15} /> Kelola Mapel ({subjects.length})
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingQuestionPackage(null);
                          setShowQuestionPackageModal(true);
                        }}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Plus size={16} /> Buat Paket Soal Baru
                      </button>
                    </div>
                  </div>

                  {/* Selected Package Details */}
                  {currentPackage && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-extrabold text-slate-800 text-base">{currentPackage.title}</h4>
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-bold">
                            {currentPackage.subject}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                            Target: {currentPackage.targetClass}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{currentPackage.description}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setEditingQuestionPackage(currentPackage);
                            setShowQuestionPackageModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit size={14} /> Edit Nama Paket
                        </button>

                        <button
                          onClick={() => handleDeleteQuestionPackage(currentPackage.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} /> Hapus Paket
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Daftar Soal Dalam Paket Ini ({currentQuestions.length} Soal)
                    </h4>
                    <button 
                      onClick={() => {
                        setEditingQuestionIdx(null);
                        setQuestionFormData({
                          id: null,
                          text: '',
                          options: ['', '', '', '', ''],
                          answer: 0
                        });
                        setShowQuestionModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus size={16} className="mr-1.5"/> Tambah Soal Baru
                    </button>
                  </div>

                  {currentQuestions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-extrabold text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                          Soal #{qIdx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingQuestionIdx(qIdx);
                              setQuestionFormData({
                                id: q.id,
                                text: q.text,
                                options: [...q.options],
                                answer: q.answer
                              });
                              setShowQuestionModal(true);
                            }}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit size={14} /> Edit
                          </button>

                          <button 
                            onClick={() => handleDeleteQuestion(qIdx)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </div>

                      <FormattedContent text={q.text} qId={q.id} fontSizeClass="text-sm font-medium" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-4">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.answer === optIdx;
                          return (
                            <div 
                              key={optIdx} 
                              className={`p-3 rounded-xl border flex items-center gap-2 ${
                                isCorrect ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB 4: MONITORING ANTI-KECURANGAN */}
          {teacherTab === 'violations' && (
            <div className="space-y-6">
              {students.some(s => s.status === 'suspended') ? (
                <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center font-bold">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-900 text-lg">Perhatian: Ada Siswa Terkunci Sementara (Pelanggaran Ke-5)</h3>
                      <p className="text-xs text-amber-700">
                        {students.filter(s => s.status === 'suspended').length} siswa terkunci. Klik "Buka Kunci" agar siswa dapat melanjutkan ujian secara otomatis.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800">
                  <ShieldCheck size={24} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-medium">Sistem Anti-Kecurangan Aktif: 1-4x Peringatan Notif (Layar Tidak Terkunci) | 5x Layar Terkunci Sementara (Buka Kunci Admin/Pengawas) | Pelanggaran Lanjutan: Hanya Peringatan (Jawaban Tidak Otomatis Terkirim).</p>
                </div>
              )}

              {/* Panel Informasi Keamanan Anti-Kecurangan Khusus HP Siswa */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wide border-b border-slate-800 pb-2">
                  <ShieldAlert size={18} />
                  <span>Proteksi Anti-Curang HP Siswa (Mobile Lockout Active)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="font-bold text-amber-400 mb-1">📱 Anti-Split Screen HP</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Siswa yang mencoba membagi layar HP (Split Screen) dicatat sebagai pelanggaran dan diberikan peringatan di layar.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="font-bold text-amber-400 mb-1">🪟 Anti-Aplikasi Mengambang</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Memblokir widget AI mengambang, kalkulator popup, dan notifikasi usap layar HP secara realtime.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="font-bold text-amber-400 mb-1">⌨️ Anti-Keyboard & Mik Suara</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Menutup paksa keyboard virtual HP & mik perintah suara. Ujian CBT pilihan ganda hanya menggunakan sentuhan opsi.
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <p className="font-bold text-amber-400 mb-1">📸 Anti-Screenshot & Watermark</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Memblokir gestur 3 jari HP serta menempelkan watermark dinamis nama siswa di seluruh lembar ujian.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Live Monitoring Keamanan Ujian Siswa</h3>
                  <span className="text-xs text-slate-400">Otomatis mencatat Pindah Tab, Screenshot, & Copy-Paste</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-6 py-4 border-b">Nama Siswa</th>
                        <th className="px-6 py-4 border-b">Kelas</th>
                        <th className="px-6 py-4 border-b text-center">Tingkat Pelanggaran</th>
                        <th className="px-6 py-4 border-b">Catatan Pelanggaran Terakhir</th>
                        <th className="px-6 py-4 border-b text-center">Status Ujian</th>
                        <th className="px-6 py-4 border-b text-center">Aksi Pengawas & Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {students.map((std) => {
                        const count = std.violationCount || 0;
                        const isSuspended = std.status === 'suspended';
                        const isForceSubmitted = std.status === 'force_submitted';

                        return (
                          <tr key={std.id} className={isForceSubmitted ? 'bg-red-50/70 hover:bg-red-50 transition-colors' : isSuspended ? 'bg-amber-50/60 hover:bg-amber-50 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                            <td className="px-6 py-4 font-bold text-slate-800">
                              {std.name}
                              <span className="block text-xs font-normal text-slate-400">@{std.username}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{std.class}</td>
                            <td className="px-6 py-4 text-center font-bold">
                              {count === 0 && (
                                <span className="text-emerald-600 font-semibold text-xs">0/5 (Bersih)</span>
                              )}
                              {count >= 1 && count < 5 && (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-extrabold border border-amber-300">
                                  {count}/5 (Peringatan)
                                </span>
                              )}
                              {count >= 5 && isSuspended && (
                                <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-extrabold border border-red-300 animate-pulse">
                                  {count}/5 (Terkunci)
                                </span>
                              )}
                              {count >= 5 && !isSuspended && (
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-extrabold border border-blue-300">
                                  {count}x (Bebas Kunci)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                              {std.lastViolationReason ? (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <AlertCircle size={14} className="flex-shrink-0" /> {std.lastViolationReason}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Tidak ada pelanggaran</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isForceSubmitted ? (
                                <span className="px-3 py-1 bg-red-700 text-white text-xs font-extrabold rounded-full">
                                  DIHENTIKAN
                                </span>
                              ) : isSuspended ? (
                                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-extrabold rounded-full animate-pulse flex items-center justify-center gap-1">
                                  <Lock size={12} /> TERKUNCI (5x)
                                </span>
                              ) : std.status === 'paused' ? (
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full flex items-center justify-center gap-1">
                                  <Clock size={12} /> DIJEDA
                                </span>
                              ) : std.status === 'active' ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                                  Sedang Ujian
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                                  Idle / Belum Masuk
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {isSuspended && (
                                  <>
                                    <button 
                                      onClick={() => unlockStudentExam(std.id)}
                                      title="Buka Kunci Siswa Ini"
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Unlock size={14} /> Buka Kunci
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                          forceSubmitStudentExam(std.id);
                                        }
                                      }}
                                      title="Hentikan Ujian Siswa Ini"
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Power size={13} /> Stop
                                    </button>
                                  </>
                                )}

                                {std.status === 'active' && (
                                  <>
                                    <button 
                                      onClick={() => pauseStudentExam(std.id)}
                                      title="Jeda Ujian Siswa Ini"
                                      className="px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Clock size={13} /> Jeda
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                          forceSubmitStudentExam(std.id);
                                        }
                                      }}
                                      title="Hentikan Ujian Siswa Ini"
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Power size={13} /> Stop
                                    </button>
                                  </>
                                )}

                                {std.status === 'paused' && (
                                  <>
                                    <button 
                                      onClick={() => resumeStudentExam(std.id)}
                                      title="Lanjutkan Ujian Siswa Ini"
                                      className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Play size={13} /> Lanjut
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (window.confirm(`Hentikan ujian untuk ${std.name} dan kumpulkan jawabannya sekarang meski waktu belum berakhir?`)) {
                                          forceSubmitStudentExam(std.id);
                                        }
                                      }}
                                      title="Hentikan Ujian Siswa Ini"
                                      className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Power size={13} /> Stop
                                    </button>
                                  </>
                                )}

                                <button 
                                  onClick={() => handleResetStudentExam(std.id)}
                                  title="Reset Pelanggaran & Sesi Ujian"
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw size={13} /> Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KONTROL & TOKEN UJIAN */}
          {teacherTab === 'controls' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Key size={20} className="mr-2 text-indigo-600"/> Pengaturan Token & Akses Ujian
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Ubah token secara real-time dan kontrol status ujian global</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Status Ujian Global</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isExamActiveGlobal 
                        ? 'Siswa yang diizinkan dapat masuk setelah input token.' 
                        : 'Seluruh siswa diblokir dari ujian meskipun memasukkan token.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => updateExamConfig(examToken, !isExamActiveGlobal, unlockPin)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isExamActiveGlobal 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30' 
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/30'
                    }`}
                  >
                    <Power size={16} /> {isExamActiveGlobal ? 'UJIAN AKTIF' : 'UJIAN DITUTUP'}
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase">TOKEN UJIAN AKTIF</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      className="flex-1 p-3.5 bg-slate-50 border-2 border-indigo-200 rounded-xl font-mono text-xl font-extrabold text-indigo-700 uppercase tracking-widest outline-none focus:border-indigo-500"
                      value={examToken}
                      onChange={e => setExamToken(e.target.value.toUpperCase())}
                    />
                    <button 
                      onClick={() => updateExamConfig(examToken, isExamActiveGlobal, unlockPin)}
                      className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Simpan Token
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Siswa wajib memasukkan token ini setelah berhasil login.</p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <label className="block text-xs font-bold text-amber-700 uppercase">PIN BUKA KUNCI SISWA DI TEMPAT</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      maxLength={10}
                      className="flex-1 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl font-mono text-xl font-extrabold text-amber-800 tracking-widest outline-none focus:border-amber-500"
                      value={unlockPin}
                      onChange={e => setUnlockPin(e.target.value)}
                    />
                    <button 
                      onClick={() => updateExamConfig(examToken, isExamActiveGlobal, unlockPin)}
                      className="px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-amber-600/30 cursor-pointer"
                    >
                      Simpan PIN
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">PIN khusus ini digunakan Admin di tempat untuk membuka kunci perangkat siswa yang mengalami pelanggaran ke-2.</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col space-y-6">
                <div className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <ShieldCheck size={20} className="mr-2 text-indigo-600"/> Panel Pemantauan & Kontrol Pengawas
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Kontrol status peserta ujian real-time untuk Pengawas Ruang & Administrator</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black self-start sm:self-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Sinkronisasi Aktif
                    </span>
                  </div>
                </div>

                {/* Ringkasan Status 700 Peserta */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">Total Peserta</span>
                    <span className="text-xl font-black text-slate-800">{students.length}</span>
                    <span className="text-[10px] text-slate-400 block">Terdaftar</span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[11px] text-emerald-700 font-bold block">Sedang Ujian</span>
                    <span className="text-xl font-black text-emerald-600">
                      {students.filter(s => s.status === 'active').length}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">Online</span>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
                    <span className="text-[11px] text-amber-700 font-bold block">Terkunci</span>
                    <span className="text-xl font-black text-amber-600">
                      {students.filter(s => s.status === 'suspended').length}
                    </span>
                    <span className="text-[10px] text-amber-600 block">Butuh Reset</span>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-center">
                    <span className="text-[11px] text-indigo-700 font-bold block">Selesai</span>
                    <span className="text-xl font-black text-indigo-600">
                      {students.filter(s => s.status === 'completed' || s.status === 'force_submitted').length}
                    </span>
                    <span className="text-[10px] text-indigo-600 block">Terkumpul</span>
                  </div>
                </div>

                {/* Aksi Cepat Pengawas */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Aksi Cepat Pengawas & Administrator:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleUnlockAllSuspended}
                      className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Unlock size={16} /> Buka Kunci Semua Siswa Terkunci ({students.filter(s => s.status === 'suspended').length})
                    </button>

                    <button
                      type="button"
                      onClick={forceSubmitAllActiveStudents}
                      disabled={!students.some(s => s.status === 'active')}
                      className="p-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Power size={16} /> Paksa Selesai Semua yang Aktif ({students.filter(s => s.status === 'active').length})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetGlobalExamAccess(true)}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle size={16} /> Izinkan Semua Siswa Masuk ({students.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetGlobalExamAccess(false)}
                      className="p-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock size={16} /> Kunci Akses Masuk Semua Siswa
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetAllStudentsExamStatus}
                      className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={15} /> Reset Status Ujian Seluruh Siswa (Persiapan Ujian Berikutnya)
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Mereset timer dan progress seluruh peserta agar dapat login mengerjakan paket ujian baru. Arsip nilai tetap aman.
                    </p>
                  </div>
                </div>

                {/* Pemantauan Siswa Terkunci / Butuh Bantuan Pengawas */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-500" /> Siswa Butuh Tindakan Pengawas ({students.filter(s => s.status === 'suspended').length})
                    </span>
                    <span className="text-[11px] text-slate-400">Diperbarui real-time</span>
                  </div>

                  {students.filter(s => s.status === 'suspended').length === 0 ? (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      Tidak ada siswa yang terkunci atau mengalami kendala saat ini.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {students.filter(s => s.status === 'suspended').map(std => (
                        <div key={std.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{std.name}</span>
                            <span className="text-slate-500 ml-2">({std.class})</span>
                            <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                              {std.lastViolationReason || 'Pelanggaran keamanan / keluar layar'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await unlockStudentExam(std.id);
                              showToast(`Kunci ujian ${std.name} berhasil dibuka.`);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                          >
                            Buka Kunci
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PENGATURAN USER (GURU & PENGAWAS) - ADMIN ONLY */}
          {teacherTab === 'staff_users' && currentStaffUser?.role === 'admin' && (
            <StaffManagementView 
              staffUsers={staffUsers}
              currentStaffUser={currentStaffUser}
              subjects={subjects}
              onSaveStaffUser={handleSaveStaffUser}
              onDeleteStaffUser={handleDeleteStaffUser}
            />
          )}

          {/* TAB 8: MASTER DATA MATA PELAJARAN - ADMIN ONLY */}
          {teacherTab === 'subjects' && currentStaffUser?.role === 'admin' && (
            <div className="space-y-6">
              {/* Header card */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <BookOpen size={22} className="text-indigo-600" />
                    Master Data Mata Pelajaran
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola daftar mata pelajaran untuk mempermudah pembuatan paket soal, konfigurasi paket ujian, penetapan guru, dan filter rekap nilai.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSubjectsToDefault}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Kembalikan daftar mata pelajaran ke 16 mapel standar"
                  >
                    <RotateCcw size={14} /> Reset ke Standar (16 Mapel)
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                      Total Mata Pelajaran
                    </span>
                    <span className="text-2xl font-black text-slate-800">{subjects.length} Mapel</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Tersedia di form paket soal</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                      Dipakai di Bank Soal
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {Array.from(new Set(questionPackages.map(p => p.subject).filter(Boolean))).length} Mapel
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{questionPackages.length} Paket Soal Aktif</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                      Dipakai di Paket Ujian
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {Array.from(new Set(examPackages.map(e => e.subjectName).filter(Boolean))).length} Mapel
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{examPackages.length} Paket Ujian Terbit</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Layers size={24} />
                  </div>
                </div>
              </div>

              {/* Main Content: Add Form & Subject Table */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
                {/* Form Input Tambah Mata Pelajaran Baru */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSubject(newSubjectInput);
                  }}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Tambah Mata Pelajaran Baru
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text"
                      placeholder="Masukkan nama mata pelajaran (contoh: Antropologi, Bahasa Jerman, Prakarya & Kewirausahaan)..."
                      value={newSubjectInput}
                      onChange={e => {
                        setNewSubjectInput(e.target.value);
                        if (newSubjectError) setNewSubjectError('');
                      }}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus size={16} /> Simpan Mata Pelajaran
                    </button>
                  </div>

                  {newSubjectError && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-200">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{newSubjectError}</span>
                    </div>
                  )}
                </form>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Daftar Mata Pelajaran ({subjects.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase().trim())).length} dari {subjects.length})
                    </h4>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text"
                      placeholder="Cari mata pelajaran..."
                      value={subjectSearch}
                      onChange={e => setSubjectSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>

                {/* Table of Subjects */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4 w-14 text-center">No</th>
                        <th className="py-3.5 px-4">Nama Mata Pelajaran</th>
                        <th className="py-3.5 px-4 text-center">Paket Soal Terkait</th>
                        <th className="py-3.5 px-4 text-center">Paket Ujian Terkait</th>
                        <th className="py-3.5 px-4 text-center">Guru Pengampu</th>
                        <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects
                        .filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase().trim()))
                        .map((subj, idx) => {
                          const linkedQPackages = questionPackages.filter(p => (p.subject || '').toLowerCase() === subj.toLowerCase());
                          const linkedEPackages = examPackages.filter(e => (e.subjectName || '').toLowerCase() === subj.toLowerCase());
                          const linkedTeachers = staffUsers.filter(u => u.role === 'guru' && (u.subject || '').toLowerCase() === subj.toLowerCase());

                          return (
                            <tr key={subj} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 text-center font-bold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 font-extrabold text-slate-800 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  <span>{subj}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {linkedQPackages.length > 0 ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200">
                                    {linkedQPackages.length} Paket Soal
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Belum ada</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {linkedEPackages.length > 0 ? (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[11px] rounded-lg border border-amber-200">
                                    {linkedEPackages.length} Paket Ujian
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Belum ada</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {linkedTeachers.length > 0 ? (
                                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200">
                                    {linkedTeachers.map(t => t.name.split('(')[0].trim()).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Belum ada guru</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Hapus mata pelajaran "${subj}" dari daftar master data?`)) {
                                      handleDeleteSubject(subj);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                                  title={`Hapus ${subj}`}
                                >
                                  <Trash2 size={13} /> Hapus
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {subjects.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase().trim())).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Tidak ada mata pelajaran yang cocok dengan kata kunci "{subjectSearch}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <Check size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    <strong>Petunjuk:</strong> Semua mata pelajaran yang ada di daftar ini akan otomatis muncul sebagai pilihan saat Anda membuat <strong>Paket Soal Baru</strong>, mengaitkannya ke <strong>Paket Ujian</strong>, menentukan <strong>Guru Mata Pelajaran</strong>, dan melihat arsip nilai per mata pelajaran.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: DATABASE CLOUDFLARE D1 - ADMIN ONLY */}
          {teacherTab === 'cloudflare' && currentStaffUser?.role === 'admin' && (
            <CloudflareD1View 
              showToast={showToast} 
              onRefreshData={() => {
                syncApi.getSyncData().then(data => {
                  if (data) {
                    if (data.students) setStudents(data.students);
                    if (data.submissions) setSubmissions(data.submissions);
                    if (data.questions) setQuestions(data.questions);
                    if (data.questionPackages) setQuestionPackages(data.questionPackages);
                    if (data.examPackages) setExamPackages(data.examPackages);
                    if (data.subjects) setSubjects(data.subjects);
                    if (data.staffUsers) setStaffUsers(data.staffUsers);
                    if (data.config) {
                      if (data.config.examToken) setExamToken(data.config.examToken);
                      if (data.config.unlockPin) setUnlockPin(data.config.unlockPin);
                      if (data.config.isExamActiveGlobal !== undefined) setIsExamActiveGlobal(data.config.isExamActiveGlobal);
                    }
                  }
                });
              }}
            />
          )}

        </div>

        {/* Modal Hapus Siswa */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Hapus Data</h3>
              
              <p className="text-slate-600 mb-6 text-xs leading-relaxed">
                {deleteConfirmTarget === 'bulk' ? (
                  <>Apakah Anda yakin ingin menghapus <strong>{selectedStudentIds.length} siswa</strong> yang terpilih? Data yang dihapus tidak dapat dikembalikan.</>
                ) : (
                  <>Apakah Anda yakin ingin menghapus siswa <strong>"{deleteConfirmTarget.name}"</strong>? Data akun akan dihapus dari sistem.</>
                )}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={executeDeleteStudent}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Import Excel */}
        {showImportModal && (
          <ImportModal 
            onClose={() => setShowImportModal(false)}
            importError={importError}
            importSuccessMsg={importSuccessMsg}
            importText={importText}
            importPreviewData={importPreviewData}
            onFileUploadImport={handleFileUploadImport}
            onImportTextChange={handleImportTextChange}
            onProcessImport={handleProcessImport}
          />
        )}

        {/* Modal Edit Siswa */}
        {editingStudent && (
          <EditStudentModal 
            editingStudent={editingStudent}
            editStudentError={editStudentError}
            setEditingStudent={setEditingStudent}
            onClose={() => setEditingStudent(null)}
            onSaveStudentEdit={handleSaveStudentEdit}
          />
        )}

        {/* Modal Cetak Kartu Peserta */}
        {showStudentCardModal && (
          <StudentCardModal 
            students={students}
            onClose={() => setShowStudentCardModal(false)}
            onDownloadPdf={handleDownloadPdf}
            isGeneratingPDF={isGeneratingPDF}
          />
        )}

        {/* Modal View Detail Submission */}
        {viewingDetail && (
          <StudentDetailModal 
            viewingDetail={viewingDetail}
            questions={questions}
            onClose={() => setViewingDetail(null)}
            onDownloadPdf={handleDownloadPdf}
            isGeneratingPDF={isGeneratingPDF}
          />
        )}

        {/* Modal Tambah Siswa Baru */}
        {showAddStudentModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
              <div className="flex justify-between items-center pb-4 border-b mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <UserPlus size={20} className="mr-2 text-indigo-600"/> Tambah Data Siswa Baru
                </h3>
                <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {addStudentError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-4">
                  {addStudentError}
                </div>
              )}

              <form onSubmit={handleAddStudent} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: Rian Pratama"
                    value={newStudent.name}
                    onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Jurusan</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: X MIPA 1"
                    value={newStudent.class}
                    onChange={e => setNewStudent({ ...newStudent, class: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: rian12"
                    value={newStudent.username}
                    onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: 123456"
                    value={newStudent.password}
                    onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    Simpan Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Soal */}
        {showQuestionModal && (
          <QuestionModal 
            editingQuestionIdx={editingQuestionIdx}
            questionFormData={questionFormData}
            setQuestionFormData={setQuestionFormData}
            onClose={() => setShowQuestionModal(false)}
            onSaveQuestion={handleSaveQuestion}
          />
        )}

        {/* Modal Question Package */}
        {showQuestionPackageModal && (
          <QuestionPackageModal
            pkg={editingQuestionPackage}
            subjects={subjects}
            onClose={() => setShowQuestionPackageModal(false)}
            onSave={handleSaveQuestionPackage}
          />
        )}

        {/* Modal Exam Package */}
        {showExamPackageModal && (
          <ExamPackageModal
            exam={editingExamPackage}
            questionPackages={questionPackages}
            students={students}
            onClose={() => setShowExamPackageModal(false)}
            onSave={handleSaveExamPackage}
          />
        )}

        {/* Modal Master Data Mata Pelajaran */}
        <SubjectManagementModal 
          isOpen={showSubjectModal}
          onClose={() => setShowSubjectModal(false)}
          subjects={subjects}
          onAddSubject={handleAddSubject}
          onDeleteSubject={handleDeleteSubject}
        />
      </div>
    );
  }

  return null;
}
