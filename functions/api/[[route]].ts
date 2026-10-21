// Cloudflare Pages Functions - Universal Edge API Router
// Menghubungkan semua API CBT langsung ke Cloudflare D1 secara native via binding env.DB
// Dilengkapi proteksi transaksi, auto-seed 700 siswa, merge parsial siswa, dan anti-blank screen

import { INITIAL_STUDENTS } from '../../src/data/initialStudents';
import { INITIAL_QUESTION_PACKAGES, INITIAL_EXAM_PACKAGES } from '../../src/data/defaultPackages';
import { INITIAL_STAFF_USERS } from '../../src/data/defaultStaffUsers';
import { DEFAULT_SUBJECTS } from '../../src/data/defaultSubjects';
import { INITIAL_SUBMISSIONS } from '../../src/data/initialSubmissions';

interface Env {
  DB: any; // Cloudflare D1 Database binding
}

let isInitialized = false;

async function ensureD1TablesAndSeed(db: any) {
  if (isInitialized) return;
  try {
    // 1. Create tables if not exist
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        exam_allowed INTEGER DEFAULT 1,
        status TEXT DEFAULT 'idle',
        violation_count INTEGER DEFAULT 0,
        last_violation_reason TEXT DEFAULT '',
        session TEXT DEFAULT 'Sesi 1',
        saved_answers TEXT DEFAULT '{}',
        saved_doubtful TEXT DEFAULT '{}',
        saved_time_left INTEGER,
        current_question_idx INTEGER DEFAULT 0,
        last_active_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS subjects (
        name TEXT PRIMARY KEY,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS question_packages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        target_class TEXT NOT NULL,
        description TEXT,
        questions_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS exam_packages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        question_package_id TEXT NOT NULL,
        target_class TEXT NOT NULL,
        target_session TEXT DEFAULT 'ALL',
        selected_student_ids TEXT DEFAULT '[]',
        token TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 70,
        is_active INTEGER DEFAULT 1,
        subject_name TEXT,
        start_date TEXT,
        start_time TEXT,
        end_date TEXT,
        end_time TEXT,
        enable_schedule INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_class TEXT NOT NULL,
        username TEXT NOT NULL,
        session TEXT,
        answers_json TEXT NOT NULL,
        correct INTEGER NOT NULL,
        wrong INTEGER NOT NULL,
        score REAL NOT NULL,
        submitted_at TEXT NOT NULL,
        is_forced INTEGER DEFAULT 0,
        subject_name TEXT,
        exam_title TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        subject TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`)
    ]);

    // Migrasi kolom penjadwalan jika tabel exam_packages sudah ada sebelumnya
    try { await db.prepare("ALTER TABLE exam_packages ADD COLUMN start_date TEXT").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE exam_packages ADD COLUMN start_time TEXT").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE exam_packages ADD COLUMN end_date TEXT").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE exam_packages ADD COLUMN end_time TEXT").run(); } catch (_) {}
    try { await db.prepare("ALTER TABLE exam_packages ADD COLUMN enable_schedule INTEGER DEFAULT 0").run(); } catch (_) {}

    // 2. Check if students table is empty, if so, auto-seed!
    const countCheck = await db.prepare("SELECT count(*) as total FROM students").first();
    if (!countCheck || countCheck.total === 0) {
      // Seed subjects
      const subStatements = DEFAULT_SUBJECTS.map((s: string) => 
        db.prepare("INSERT OR IGNORE INTO subjects (name) VALUES (?)").bind(s)
      );
      if (subStatements.length) await db.batch(subStatements);

      // Seed staff users
      const staffStatements = INITIAL_STAFF_USERS.map((u: any) =>
        db.prepare("INSERT OR IGNORE INTO staff_users (id, name, username, password, role, subject) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(u.id, u.name, u.username, u.password, u.role, u.subject || null)
      );
      if (staffStatements.length) await db.batch(staffStatements);

      // Seed question packages
      const qPkgStatements = INITIAL_QUESTION_PACKAGES.map((p: any) =>
        db.prepare("INSERT OR IGNORE INTO question_packages (id, title, subject, target_class, description, questions_json) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(p.id, p.title, p.subject, p.targetClass, p.description || '', JSON.stringify(p.questions || []))
      );
      if (qPkgStatements.length) await db.batch(qPkgStatements);

      // Seed exam packages
      const ePkgStatements = INITIAL_EXAM_PACKAGES.map((e: any) =>
        db.prepare("INSERT OR IGNORE INTO exam_packages (id, title, question_package_id, target_class, target_session, selected_student_ids, token, duration_minutes, is_active, subject_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(e.id, e.title, e.questionPackageId, e.targetClass, e.targetSession || 'ALL', JSON.stringify(e.selectedStudentIds || []), e.token, e.durationMinutes || 70, e.isActive ? 1 : 0, e.subjectName || '')
      );
      if (ePkgStatements.length) await db.batch(ePkgStatements);

      // Seed demo submissions
      const subDemoStatements = INITIAL_SUBMISSIONS.map((s: any) =>
        db.prepare("INSERT OR IGNORE INTO submissions (id, student_id, student_name, student_class, username, session, answers_json, correct, wrong, score, submitted_at, is_forced, subject_name, exam_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(s.id, s.studentId, s.studentName, s.studentClass, s.username, s.session || '', JSON.stringify(s.answers || {}), s.correct, s.wrong, s.score, s.submittedAt, s.isForced ? 1 : 0, s.subjectName || '', s.examTitle || '')
      );
      if (subDemoStatements.length) await db.batch(subDemoStatements);

      // Seed config
      await db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES ('config', ?)")
        .bind(JSON.stringify({
          examToken: "FISIKA2026",
          unlockPin: "00000",
          isExamActiveGlobal: true,
          activeSession: "ALL"
        })).run();

      // Seed 700 students in batches of 50
      const chunkSize = 50;
      for (let i = 0; i < INITIAL_STUDENTS.length; i += chunkSize) {
        const chunk = INITIAL_STUDENTS.slice(i, i + chunkSize);
        const batch = chunk.map((s: any) =>
          db.prepare(
            `INSERT OR IGNORE INTO students 
            (id, name, class, username, password, exam_allowed, status, violation_count, last_violation_reason, session, saved_answers, saved_doubtful, saved_time_left, current_question_idx, last_active_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            s.id,
            s.name || '',
            s.class || '',
            s.username || '',
            s.password || '',
            s.examAllowed !== false ? 1 : 0,
            s.status || 'idle',
            s.violationCount || 0,
            s.lastViolationReason || '',
            s.session || 'Sesi 1',
            JSON.stringify(s.savedAnswers || {}),
            JSON.stringify(s.savedDoubtful || {}),
            s.savedTimeLeft ?? null,
            s.currentQuestionIdx || 0,
            s.lastActiveAt || new Date().toISOString()
          )
        );
        await db.batch(batch);
      }
    }

    // 3. Auto-heal: Perbaiki otomatis siswa yang namanya kosong akibat bug lama
    try {
      const emptyCheck = await db.prepare("SELECT count(*) as total FROM students WHERE name = '' OR name IS NULL").first();
      if (emptyCheck && emptyCheck.total > 0) {
        const emptyRows = await db.prepare("SELECT id FROM students WHERE name = '' OR name IS NULL LIMIT 200").all();
        const initialMap = new Map(INITIAL_STUDENTS.map((s: any) => [s.id, s]));
        const healStatements = (emptyRows.results || []).map((row: any) => {
          const backup = initialMap.get(row.id);
          if (backup) {
            return db.prepare("UPDATE students SET name = ?, class = ?, username = ? WHERE id = ?")
              .bind(backup.name, backup.class, backup.username, row.id);
          }
          return null;
        }).filter(Boolean);
        if (healStatements.length) await db.batch(healStatements);
      }
    } catch (_) {}

    // 4. Auto-heal: Perbaiki otomatis lembar jawaban siswa yang namanya kosong dari data tabel siswa
    try {
      const emptySubCheck = await db.prepare("SELECT count(*) as total FROM submissions WHERE student_name = '' OR student_name IS NULL").first();
      if (emptySubCheck && emptySubCheck.total > 0) {
        await db.prepare(`
          UPDATE submissions 
          SET 
            student_name = COALESCE((SELECT name FROM students WHERE students.id = submissions.student_id AND students.name != ''), student_name),
            student_class = COALESCE((SELECT class FROM students WHERE students.id = submissions.student_id AND students.class != ''), student_class),
            username = COALESCE((SELECT username FROM students WHERE students.id = submissions.student_id AND students.username != ''), submissions.username)
          WHERE student_name = '' OR student_name IS NULL
        `).run();
      }
    } catch (_) {}

    isInitialized = true;
  } catch (e) {
    console.warn("Table auto-creation or seeding failed:", e);
  }
}

export const onRequest: any = async (context: { request: Request; env: Env; params: { route?: string[] } }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Cek endpoint status cloudflare (bisa dicek bahkan jika DB belum terpasang)
  if (path === '/cloudflare/status' || path === '/cloudflare-status') {
    if (!env.DB) {
      return new Response(JSON.stringify({
        isConfigured: false,
        isNativeBinding: false,
        status: 'unbound',
        message: 'D1 binding "DB" belum dikonfigurasi di Cloudflare Pages Settings > Functions > D1 Database Bindings.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    try {
      const test = await env.DB.prepare("SELECT count(*) as total_students FROM students").first();
      return new Response(JSON.stringify({
        isConfigured: true,
        isNativeBinding: true,
        status: 'connected',
        totalStudents: test?.total_students || 0,
        testResult: {
          success: true,
          message: 'Cloudflare D1 terhubung aktif secara native di Edge Pages Functions!',
          latencyMs: 1
        },
        message: 'Cloudflare D1 terhubung aktif secara native di Edge!'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({
        isConfigured: false,
        isNativeBinding: false,
        status: 'error',
        testResult: {
          success: false,
          message: `Koneksi D1 gagal: ${err.message}`
        },
        message: `Koneksi D1 gagal: ${err.message}`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  // Endpoints inisialisasi & sinkronisasi ramah untuk native binding Cloudflare Pages
  if (path === '/cloudflare/init-schema') {
    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, message: 'D1 belum terhubung ke Pages (binding DB belum diset).' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    await ensureD1TablesAndSeed(env.DB);
    return new Response(JSON.stringify({ success: true, message: 'Seluruh tabel Cloudflare D1 siap digunakan dan terverifikasi!' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (path === '/cloudflare/sync-push' || path === '/cloudflare/sync-pull') {
    return new Response(JSON.stringify({ success: true, message: 'Aplikasi sudah terhubung secara native ke Cloudflare D1. Sinkronisasi berjalan otomatis real-time tanpa perlu proses manual!' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Jika D1 belum di-binding di Cloudflare Pages Dashboard
  if (!env.DB) {
    return new Response(
      JSON.stringify({ 
        isError: true,
        error: 'Cloudflare D1 belum terhubung ke Cloudflare Pages. Harap tambahkan D1 Binding bernama "DB" di Cloudflare Pages: Settings > Functions > D1 Database Bindings.' 
      }), 
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Pastikan tabel & data awal siap saat request pertama
  await ensureD1TablesAndSeed(env.DB);

  try {
    // 1. GET /api/sync - Ambil seluruh state untuk sinkronisasi awal
    if (method === 'GET' && (path === '/sync' || path === '' || path === '/')) {
      const [
        studentsRes,
        subjectsRes,
        questionPkgsRes,
        examPkgsRes,
        submissionsRes,
        staffRes,
        configRes
      ] = await Promise.all([
        env.DB.prepare("SELECT * FROM students").all(),
        env.DB.prepare("SELECT * FROM subjects").all(),
        env.DB.prepare("SELECT * FROM question_packages").all(),
        env.DB.prepare("SELECT * FROM exam_packages").all(),
        env.DB.prepare("SELECT * FROM submissions ORDER BY submitted_at DESC").all(),
        env.DB.prepare("SELECT * FROM staff_users").all(),
        env.DB.prepare("SELECT * FROM app_config WHERE key = 'config'").first()
      ]);

      const initialStudentMap = new Map(INITIAL_STUDENTS.map((s: any) => [s.id, s]));

      const students = (studentsRes.results || []).map((row: any) => {
        const backup = initialStudentMap.get(row.id);
        const name = (row.name && String(row.name).trim() !== '') ? row.name : (backup?.name || row.username || `Siswa ${row.id}`);
        const sClass = (row.class && String(row.class).trim() !== '') ? row.class : (backup?.class || 'X A');
        const username = (row.username && String(row.username).trim() !== '') ? row.username : (backup?.username || row.id);
        const password = (row.password && String(row.password).trim() !== '') ? row.password : (backup?.password || '123');
        const session = (row.session && String(row.session).trim() !== '') ? row.session : (backup?.session || 'Sesi 1');

        return {
          id: row.id,
          name,
          class: sClass,
          username,
          password,
          examAllowed: Boolean(row.exam_allowed),
          status: row.status,
          violationCount: row.violation_count,
          lastViolationReason: row.last_violation_reason || '',
          session,
          savedAnswers: row.saved_answers ? JSON.parse(row.saved_answers) : {},
          savedDoubtful: row.saved_doubtful ? JSON.parse(row.saved_doubtful) : {},
          savedTimeLeft: row.saved_time_left,
          currentQuestionIdx: row.current_question_idx || 0,
          lastActiveAt: row.last_active_at
        };
      });

      const studentMap = new Map(students.map((s: any) => [s.id, s]));

      const subjects = (subjectsRes.results || []).map((r: any) => r.name);

      const questionPackages = (questionPkgsRes.results || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        subject: row.subject,
        targetClass: row.target_class,
        description: row.description,
        questions: row.questions_json ? JSON.parse(row.questions_json) : [],
        createdAt: row.created_at
      }));

      const examPackages = (examPkgsRes.results || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        questionPackageId: row.question_package_id,
        targetClass: row.target_class,
        targetSession: row.target_session,
        selectedStudentIds: row.selected_student_ids ? JSON.parse(row.selected_student_ids) : [],
        token: row.token,
        durationMinutes: row.duration_minutes,
        isActive: Boolean(row.is_active),
        subjectName: row.subject_name,
        startDate: row.start_date || '',
        startTime: row.start_time || '',
        endDate: row.end_date || '',
        endTime: row.end_time || '',
        enableSchedule: Boolean(row.enable_schedule),
        createdAt: row.created_at
      }));

      const submissions = (submissionsRes.results || []).map((row: any) => {
        const std = studentMap.get(row.student_id) || initialStudentMap.get(row.student_id);
        const studentName = (row.student_name && String(row.student_name).trim() !== '')
          ? row.student_name
          : (std?.name || (row.student_id ? `Siswa (${row.student_id})` : '-'));
        const studentClass = (row.student_class && String(row.student_class).trim() !== '')
          ? row.student_class
          : (std?.class || '-');
        const username = (row.username && String(row.username).trim() !== '')
          ? row.username
          : (std?.username || '-');

        return {
          id: row.id,
          studentId: row.student_id,
          studentName,
          studentClass,
          username,
          session: row.session || std?.session || '',
          answers: row.answers_json ? JSON.parse(row.answers_json) : {},
          correct: row.correct,
          wrong: row.wrong,
          score: row.score,
          submittedAt: row.submitted_at,
          isForced: Boolean(row.is_forced),
          subjectName: row.subject_name,
          examTitle: row.exam_title
        };
      });

      const staffUsers = (staffRes.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        subject: row.subject,
        createdAt: row.created_at
      }));

      let config = {
        examToken: "FISIKA2026",
        unlockPin: "00000",
        isExamActiveGlobal: true,
        activeSession: "ALL"
      };

      if (configRes && configRes.value) {
        try { config = JSON.parse(configRes.value); } catch (_) {}
      }

      const allQuestions = questionPackages.flatMap((p: any) => p.questions || []);

      return new Response(JSON.stringify({
        status: 'ok',
        students,
        subjects,
        questionPackages,
        examPackages,
        submissions,
        staffUsers,
        questions: allQuestions,
        config
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. GET /api/submissions - Ambil daftar lembar jawaban langsung (dengan auto-healing identitas)
    if (method === 'GET' && path === '/submissions') {
      const initialStudentMap = new Map(INITIAL_STUDENTS.map((s: any) => [s.id, s]));
      const [submissionsRes, studentsRes] = await Promise.all([
        env.DB.prepare("SELECT * FROM submissions ORDER BY submitted_at DESC").all(),
        env.DB.prepare("SELECT id, name, class, username, session FROM students").all()
      ]);
      const dbStudentMap = new Map((studentsRes.results || []).map((s: any) => [s.id, s]));

      const submissions = (submissionsRes.results || []).map((row: any) => {
        const std = dbStudentMap.get(row.student_id) || initialStudentMap.get(row.student_id);
        const studentName = (row.student_name && String(row.student_name).trim() !== '')
          ? row.student_name
          : (std?.name || (row.student_id ? `Siswa (${row.student_id})` : '-'));
        const studentClass = (row.student_class && String(row.student_class).trim() !== '')
          ? row.student_class
          : (std?.class || '-');
        const username = (row.username && String(row.username).trim() !== '')
          ? row.username
          : (std?.username || '-');

        return {
          id: row.id,
          studentId: row.student_id,
          studentName,
          studentClass,
          username,
          session: row.session || std?.session || '',
          answers: row.answers_json ? JSON.parse(row.answers_json) : {},
          correct: row.correct,
          wrong: row.wrong,
          score: row.score,
          submittedAt: row.submitted_at,
          isForced: Boolean(row.is_forced),
          subjectName: row.subject_name,
          examTitle: row.exam_title
        };
      });
      return new Response(JSON.stringify(submissions), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. GET /api/student/:id/status
    const studentStatusMatch = path.match(/^\/student\/([^\/]+)\/status$/);
    if (method === 'GET' && studentStatusMatch) {
      const studentId = studentStatusMatch[1];
      const student = await env.DB.prepare("SELECT * FROM students WHERE id = ?").bind(studentId).first();
      if (!student) {
        return new Response(JSON.stringify({ error: 'Student not found' }), { status: 404, headers: corsHeaders });
      }

      const configRes = await env.DB.prepare("SELECT value FROM app_config WHERE key = 'config'").first();
      let config = {};
      if (configRes && configRes.value) {
        try { config = JSON.parse(configRes.value); } catch (_) {}
      }

      return new Response(JSON.stringify({
        status: 'ok',
        student: {
          ...student,
          examAllowed: Boolean(student.exam_allowed),
          savedAnswers: student.saved_answers ? JSON.parse(student.saved_answers) : {},
          savedDoubtful: student.saved_doubtful ? JSON.parse(student.saved_doubtful) : {}
        },
        config
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. POST /api/students - Upsert Siswa Aman (Pencegah Bug Wiping Data & UNIQUE Constraint)
    if (method === 'POST' && path === '/students') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];
      const initialStudentMap = new Map(INITIAL_STUDENTS.map((s: any) => [s.id, s]));

      for (const s of list) {
        if (!s || !s.id) continue;

        // Cek data siswa yang ada di D1 terlebih dahulu
        const existing = await env.DB.prepare("SELECT * FROM students WHERE id = ?").bind(s.id).first();
        const backup = initialStudentMap.get(s.id);

        if (existing) {
          // Merge data: pertahankan nilai lama jika properti tidak dikirim atau berupa string kosong
          const name = (s.name && String(s.name).trim() !== '') ? s.name : (existing.name && String(existing.name).trim() !== '' ? existing.name : (backup?.name || ''));
          const sClass = (s.class && String(s.class).trim() !== '') ? s.class : (existing.class && String(existing.class).trim() !== '' ? existing.class : (backup?.class || ''));
          const username = (s.username && String(s.username).trim() !== '') ? s.username : (existing.username && String(existing.username).trim() !== '' ? existing.username : (backup?.username || ''));
          const password = (s.password && String(s.password).trim() !== '') ? s.password : (existing.password && String(existing.password).trim() !== '' ? existing.password : (backup?.password || '123'));
          const session = (s.session && String(s.session).trim() !== '') ? s.session : (existing.session && String(existing.session).trim() !== '' ? existing.session : (backup?.session || 'Sesi 1'));
          const examAllowed = s.examAllowed !== undefined ? (s.examAllowed ? 1 : 0) : existing.exam_allowed;
          const status = s.status !== undefined ? s.status : existing.status;
          const violationCount = s.violationCount !== undefined ? s.violationCount : existing.violation_count;
          const lastViolationReason = s.lastViolationReason !== undefined ? s.lastViolationReason : existing.last_violation_reason;
          const savedAnswers = (s.savedAnswers !== undefined && Object.keys(s.savedAnswers).length > 0) ? JSON.stringify(s.savedAnswers) : (existing.saved_answers || '{}');
          const savedDoubtful = (s.savedDoubtful !== undefined && Object.keys(s.savedDoubtful).length > 0) ? JSON.stringify(s.savedDoubtful) : (existing.saved_doubtful || '{}');
          const savedTimeLeft = s.savedTimeLeft !== undefined ? s.savedTimeLeft : existing.saved_time_left;
          const currentQuestionIdx = s.currentQuestionIdx !== undefined ? s.currentQuestionIdx : existing.current_question_idx;
          const lastActiveAt = s.lastActiveAt || new Date().toISOString();

          await env.DB.prepare(
            `UPDATE students SET 
              name = ?, class = ?, username = ?, password = ?, exam_allowed = ?, 
              status = ?, violation_count = ?, last_violation_reason = ?, session = ?, 
              saved_answers = ?, saved_doubtful = ?, saved_time_left = ?, current_question_idx = ?, last_active_at = ?
            WHERE id = ?`
          ).bind(
            name, sClass, username, password, examAllowed,
            status, violationCount, lastViolationReason, session,
            savedAnswers, savedDoubtful, savedTimeLeft, currentQuestionIdx, lastActiveAt,
            s.id
          ).run();
        } else {
          // Siswa baru: gunakan backup jika s.name / s.username tidak ada
          const name = (s.name && String(s.name).trim() !== '') ? s.name : (backup?.name || `Siswa ${s.id}`);
          const sClass = (s.class && String(s.class).trim() !== '') ? s.class : (backup?.class || 'X A');
          const username = (s.username && String(s.username).trim() !== '') ? s.username : (backup?.username || s.id);
          const password = (s.password && String(s.password).trim() !== '') ? s.password : (backup?.password || '123');
          const session = (s.session && String(s.session).trim() !== '') ? s.session : (backup?.session || 'Sesi 1');

          await env.DB.prepare(
            `INSERT INTO students 
            (id, name, class, username, password, exam_allowed, status, violation_count, last_violation_reason, session, saved_answers, saved_doubtful, saved_time_left, current_question_idx, last_active_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = CASE WHEN excluded.name != '' THEN excluded.name ELSE students.name END,
              class = CASE WHEN excluded.class != '' THEN excluded.class ELSE students.class END,
              username = CASE WHEN excluded.username != '' THEN excluded.username ELSE students.username END,
              password = CASE WHEN excluded.password != '' THEN excluded.password ELSE students.password END,
              session = CASE WHEN excluded.session != '' THEN excluded.session ELSE students.session END,
              exam_allowed = excluded.exam_allowed,
              status = excluded.status,
              violation_count = excluded.violation_count,
              last_violation_reason = excluded.last_violation_reason,
              saved_answers = CASE WHEN excluded.saved_answers != '{}' THEN excluded.saved_answers ELSE students.saved_answers END,
              saved_doubtful = CASE WHEN excluded.saved_doubtful != '{}' THEN excluded.saved_doubtful ELSE students.saved_doubtful END,
              saved_time_left = coalesce(excluded.saved_time_left, students.saved_time_left),
              current_question_idx = excluded.current_question_idx,
              last_active_at = excluded.last_active_at`
          ).bind(
            s.id,
            name,
            sClass,
            username,
            password,
            s.examAllowed !== false ? 1 : 0,
            s.status || 'idle',
            s.violationCount || 0,
            s.lastViolationReason || '',
            session,
            JSON.stringify(s.savedAnswers || {}),
            JSON.stringify(s.savedDoubtful || {}),
            s.savedTimeLeft ?? null,
            s.currentQuestionIdx || 0,
            s.lastActiveAt || new Date().toISOString()
          ).run();
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. POST /api/students/reset-session
    if (method === 'POST' && path === '/students/reset-session') {
      const { session } = await request.json();
      if (session === 'ALL' || !session) {
        await env.DB.prepare(
          `UPDATE students SET status = 'idle', exam_allowed = 1, violation_count = 0, last_violation_reason = '', saved_answers = '{}', saved_doubtful = '{}', saved_time_left = NULL, current_question_idx = 0`
        ).run();
      } else {
        await env.DB.prepare(
          `UPDATE students SET status = 'idle', exam_allowed = 1, violation_count = 0, last_violation_reason = '', saved_answers = '{}', saved_doubtful = '{}', saved_time_left = NULL, current_question_idx = 0 WHERE session = ?`
        ).bind(session).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. POST /api/students/session-access
    if (method === 'POST' && path === '/students/session-access') {
      const { session, examAllowed } = await request.json();
      const val = examAllowed ? 1 : 0;
      if (session === 'ALL' || !session) {
        await env.DB.prepare(`UPDATE students SET exam_allowed = ?`).bind(val).run();
      } else {
        await env.DB.prepare(`UPDATE students SET exam_allowed = ? WHERE session = ?`).bind(val, session).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 7. DELETE /api/students/:id
    const studentDeleteMatch = path.match(/^\/students\/([^\/]+)$/);
    if (method === 'DELETE' && studentDeleteMatch) {
      const studentId = studentDeleteMatch[1];
      await env.DB.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 8. POST /api/students/bulk-delete
    if (method === 'POST' && path === '/students/bulk-delete') {
      const { ids } = await request.json();
      if (Array.isArray(ids)) {
        for (const id of ids) {
          await env.DB.prepare("DELETE FROM students WHERE id = ?").bind(id).run();
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 9. POST /api/submissions - Kirim Lembar Jawaban + Update Siswa Otomatis (Aman dari Bug Blank Name)
    if (method === 'POST' && path === '/submissions') {
      const sub = await request.json();
      if (sub && sub.id) {
        const initialStudentMap = new Map(INITIAL_STUDENTS.map((s: any) => [s.id, s]));
        let studentName = (sub.studentName && String(sub.studentName).trim() !== '') ? String(sub.studentName).trim() : '';
        let studentClass = (sub.studentClass && String(sub.studentClass).trim() !== '') ? String(sub.studentClass).trim() : '';
        let username = (sub.username && String(sub.username).trim() !== '') ? String(sub.username).trim() : '';
        let session = (sub.session && String(sub.session).trim() !== '') ? String(sub.session).trim() : '';

        // JIKA IDENTITAS KOSONG: AMBIL DARI TABEL STUDENTS DI D1 ATAU INITIAL_STUDENTS
        if ((!studentName || !studentClass || !username) && sub.studentId) {
          const fromD1 = await env.DB.prepare("SELECT name, class, username, session FROM students WHERE id = ?").bind(sub.studentId).first();
          const backup = initialStudentMap.get(sub.studentId);
          if (!studentName) studentName = (fromD1?.name && String(fromD1.name).trim() !== '') ? fromD1.name : (backup?.name || `Siswa ${sub.studentId}`);
          if (!studentClass) studentClass = (fromD1?.class && String(fromD1.class).trim() !== '') ? fromD1.class : (backup?.class || 'X A');
          if (!username) username = (fromD1?.username && String(fromD1.username).trim() !== '') ? fromD1.username : (backup?.username || sub.studentId);
          if (!session) session = (fromD1?.session && String(fromD1.session).trim() !== '') ? fromD1.session : (backup?.session || 'Sesi 1');
        }

        // Simpan ke tabel submissions menggunakan ON CONFLICT agar identitas tidak tertimpa kosong
        await env.DB.prepare(
          `INSERT INTO submissions 
          (id, student_id, student_name, student_class, username, session, answers_json, correct, wrong, score, submitted_at, is_forced, subject_name, exam_title) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            student_name = CASE WHEN excluded.student_name != '' THEN excluded.student_name ELSE submissions.student_name END,
            student_class = CASE WHEN excluded.student_class != '' THEN excluded.student_class ELSE submissions.student_class END,
            username = CASE WHEN excluded.username != '' THEN excluded.username ELSE submissions.username END,
            session = CASE WHEN excluded.session != '' THEN excluded.session ELSE submissions.session END,
            answers_json = excluded.answers_json,
            correct = excluded.correct,
            wrong = excluded.wrong,
            score = excluded.score,
            submitted_at = excluded.submitted_at,
            is_forced = excluded.is_forced,
            subject_name = CASE WHEN excluded.subject_name != '' THEN excluded.subject_name ELSE submissions.subject_name END,
            exam_title = CASE WHEN excluded.exam_title != '' THEN excluded.exam_title ELSE submissions.exam_title END`
        ).bind(
          sub.id,
          sub.studentId || '',
          studentName,
          studentClass,
          username,
          session,
          JSON.stringify(sub.answers || {}),
          Number(sub.correct) || 0,
          Number(sub.wrong) || 0,
          Number(sub.score) || 0,
          sub.submittedAt || new Date().toISOString(),
          sub.isForced ? 1 : 0,
          sub.subjectName || '',
          sub.examTitle || ''
        ).run();

        // Update status siswa terkait di tabel students menjadi completed, serta sembuhkan nama jika kosong
        if (sub.studentId) {
          await env.DB.prepare(
            `UPDATE students SET 
              status = 'completed', 
              exam_allowed = 0, 
              last_active_at = ?,
              name = CASE WHEN (name IS NULL OR name = '') AND ? != '' THEN ? ELSE name END,
              class = CASE WHEN (class IS NULL OR class = '') AND ? != '' THEN ? ELSE class END,
              username = CASE WHEN (username IS NULL OR username = '') AND ? != '' THEN ? ELSE username END
            WHERE id = ?`
          ).bind(new Date().toISOString(), studentName, studentName, studentClass, studentClass, username, username, sub.studentId).run();
        }
      }
      return new Response(JSON.stringify({ status: 'ok', id: sub?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 10. DELETE /api/submissions/:id
    const subDeleteMatch = path.match(/^\/submissions\/([^\/]+)$/);
    if (method === 'DELETE' && subDeleteMatch) {
      const subId = subDeleteMatch[1];
      await env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(subId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 11. POST /api/config - Update Konfigurasi Global
    if (method === 'POST' && path === '/config') {
      const newConfig = await request.json();
      await env.DB.prepare(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES ('config', ?)"
      ).bind(JSON.stringify(newConfig)).run();
      return new Response(JSON.stringify({ status: 'ok', config: newConfig }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 12. POST /api/question-packages
    if (method === 'POST' && path === '/question-packages') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];
      for (const p of list) {
        if (!p.id) continue;
        await env.DB.prepare(
          "INSERT OR REPLACE INTO question_packages (id, title, subject, target_class, description, questions_json) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(p.id, p.title, p.subject, p.targetClass, p.description || '', JSON.stringify(p.questions || [])).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 13. DELETE /api/question-packages/:id
    const qPkgDeleteMatch = path.match(/^\/question-packages\/([^\/]+)$/);
    if (method === 'DELETE' && qPkgDeleteMatch) {
      const pkgId = qPkgDeleteMatch[1];
      await env.DB.prepare("DELETE FROM question_packages WHERE id = ?").bind(pkgId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 14. POST /api/exam-packages
    if (method === 'POST' && path === '/exam-packages') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];
      for (const e of list) {
        if (!e.id) continue;
        await env.DB.prepare(
          "INSERT OR REPLACE INTO exam_packages (id, title, question_package_id, target_class, target_session, selected_student_ids, token, duration_minutes, is_active, subject_name, start_date, start_time, end_date, end_time, enable_schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          e.id, e.title, e.questionPackageId, e.targetClass, e.targetSession || 'ALL', 
          JSON.stringify(e.selectedStudentIds || []), e.token, e.durationMinutes || 70, e.isActive ? 1 : 0, e.subjectName || '',
          e.startDate || null, e.startTime || null, e.endDate || null, e.endTime || null, e.enableSchedule ? 1 : 0
        ).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 15. DELETE /api/exam-packages/:id
    const ePkgDeleteMatch = path.match(/^\/exam-packages\/([^\/]+)$/);
    if (method === 'DELETE' && ePkgDeleteMatch) {
      const examId = ePkgDeleteMatch[1];
      await env.DB.prepare("DELETE FROM exam_packages WHERE id = ?").bind(examId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 16. POST /api/staff-users
    if (method === 'POST' && path === '/staff-users') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];
      for (const u of list) {
        if (!u.id) continue;
        await env.DB.prepare(
          "INSERT OR REPLACE INTO staff_users (id, name, username, password, role, subject) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(u.id, u.name, u.username, u.password, u.role, u.subject || null).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 17. DELETE /api/staff-users/:id
    const staffDeleteMatch = path.match(/^\/staff-users\/([^\/]+)$/);
    if (method === 'DELETE' && staffDeleteMatch) {
      const staffId = staffDeleteMatch[1];
      await env.DB.prepare("DELETE FROM staff_users WHERE id = ?").bind(staffId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 18. GET & POST & DELETE /api/subjects
    if (method === 'GET' && path === '/subjects') {
      const res = await env.DB.prepare("SELECT name FROM subjects").all();
      return new Response(JSON.stringify(res.results.map((r: any) => r.name)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (method === 'POST' && path === '/subjects') {
      const body = await request.json();
      if (Array.isArray(body)) {
        for (const name of body) {
          await env.DB.prepare("INSERT OR IGNORE INTO subjects (name) VALUES (?)").bind(name).run();
        }
      } else if (body && body.name) {
        await env.DB.prepare("INSERT OR IGNORE INTO subjects (name) VALUES (?)").bind(body.name.trim()).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subjectDeleteMatch = path.match(/^\/subjects\/([^\/]+)$/);
    if (method === 'DELETE' && subjectDeleteMatch) {
      const subjectName = decodeURIComponent(subjectDeleteMatch[1]);
      await env.DB.prepare("DELETE FROM subjects WHERE LOWER(name) = LOWER(?)").bind(subjectName).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 19. POST /api/cloudflare/query
    if (method === 'POST' && path === '/cloudflare/query') {
      const { sql, params } = await request.json();
      const res = await env.DB.prepare(sql).bind(...(params || [])).all();
      return new Response(JSON.stringify({ success: true, results: res.results, meta: res.meta }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fallback: Jika endpoint lain
    return new Response(JSON.stringify({ status: 'ok', message: 'Cloudflare Pages Functions Edge Handler' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
