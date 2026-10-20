// Cloudflare Pages Functions - Universal Edge API Router
// Menghubungkan semua API CBT langsung ke Cloudflare D1 secara native via binding env.DB
// Otomatis membuat tabel & inisialisasi data 700 siswa jika database D1 baru

import { INITIAL_STUDENTS } from '../../src/data/initialStudents';
import { INITIAL_QUESTION_PACKAGES, INITIAL_EXAM_PACKAGES } from '../../src/data/defaultPackages';
import { INITIAL_STAFF_USERS } from '../../src/data/defaultStaffUsers';
import { DEFAULT_SUBJECTS } from '../../src/data/defaultSubjects';
import { INITIAL_SUBMISSIONS } from '../../src/data/initialSubmissions';

interface Env {
  DB: any; // Cloudflare D1 Database binding
}

async function ensureD1TablesAndSeed(db: any) {
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

  // Jika D1 belum di-binding, beri pesan informatif
  if (!env.DB) {
    return new Response(
      JSON.stringify({ 
        error: 'Cloudflare D1 belum terhubung ke Cloudflare Pages. Tambahkan binding D1 bernama "DB" di Settings > Functions > D1 Database Bindings.' 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      const students = (studentsRes.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        class: row.class,
        username: row.username,
        password: row.password,
        examAllowed: Boolean(row.exam_allowed),
        status: row.status,
        violationCount: row.violation_count,
        lastViolationReason: row.last_violation_reason || '',
        session: row.session,
        savedAnswers: row.saved_answers ? JSON.parse(row.saved_answers) : {},
        savedDoubtful: row.saved_doubtful ? JSON.parse(row.saved_doubtful) : {},
        savedTimeLeft: row.saved_time_left,
        currentQuestionIdx: row.current_question_idx || 0,
        lastActiveAt: row.last_active_at
      }));

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
        createdAt: row.created_at
      }));

      const submissions = (submissionsRes.results || []).map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentClass: row.student_class,
        username: row.username,
        session: row.session,
        answers: row.answers_json ? JSON.parse(row.answers_json) : {},
        correct: row.correct,
        wrong: row.wrong,
        score: row.score,
        submittedAt: row.submitted_at,
        isForced: Boolean(row.is_forced),
        subjectName: row.subject_name,
        examTitle: row.exam_title
      }));

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

    // 2. GET /api/student/:id/status
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

    // 3. POST /api/students - Upsert Siswa
    if (method === 'POST' && path === '/students') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];

      for (const s of list) {
        if (!s.id) continue;
        await env.DB.prepare(
          `INSERT OR REPLACE INTO students 
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
        ).run();
      }

      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. POST /api/students/reset-session
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

    // 5. POST /api/students/session-access
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

    // 6. DELETE /api/students/:id
    const studentDeleteMatch = path.match(/^\/students\/([^\/]+)$/);
    if (method === 'DELETE' && studentDeleteMatch) {
      const studentId = studentDeleteMatch[1];
      await env.DB.prepare("DELETE FROM students WHERE id = ?").bind(studentId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 7. POST /api/students/bulk-delete
    if (method === 'POST' && path === '/students/bulk-delete') {
      const { ids } = await request.json();
      if (Array.isArray(ids)) {
        for (const id of ids) {
          await env.DB.prepare("DELETE FROM students WHERE id = ?").bind(id).run();
        }
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 8. POST /api/submissions - Kirim Lembar Jawaban
    if (method === 'POST' && path === '/submissions') {
      const sub = await request.json();
      if (sub && sub.id) {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO submissions 
          (id, student_id, student_name, student_class, username, session, answers_json, correct, wrong, score, submitted_at, is_forced, subject_name, exam_title) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sub.id,
          sub.studentId,
          sub.studentName,
          sub.studentClass,
          sub.username,
          sub.session || '',
          JSON.stringify(sub.answers || {}),
          sub.correct,
          sub.wrong,
          sub.score,
          sub.submittedAt || new Date().toISOString(),
          sub.isForced ? 1 : 0,
          sub.subjectName || '',
          sub.examTitle || ''
        ).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 9. DELETE /api/submissions/:id
    const subDeleteMatch = path.match(/^\/submissions\/([^\/]+)$/);
    if (method === 'DELETE' && subDeleteMatch) {
      const subId = subDeleteMatch[1];
      await env.DB.prepare("DELETE FROM submissions WHERE id = ?").bind(subId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 10. POST /api/config - Update Konfigurasi Global
    if (method === 'POST' && path === '/config') {
      const newConfig = await request.json();
      await env.DB.prepare(
        "INSERT OR REPLACE INTO app_config (key, value) VALUES ('config', ?)"
      ).bind(JSON.stringify(newConfig)).run();
      return new Response(JSON.stringify({ status: 'ok', config: newConfig }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 11. POST /api/question-packages
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

    // 12. DELETE /api/question-packages/:id
    const qPkgDeleteMatch = path.match(/^\/question-packages\/([^\/]+)$/);
    if (method === 'DELETE' && qPkgDeleteMatch) {
      const pkgId = qPkgDeleteMatch[1];
      await env.DB.prepare("DELETE FROM question_packages WHERE id = ?").bind(pkgId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 13. POST /api/exam-packages
    if (method === 'POST' && path === '/exam-packages') {
      const incoming = await request.json();
      const list = Array.isArray(incoming) ? incoming : [incoming];
      for (const e of list) {
        if (!e.id) continue;
        await env.DB.prepare(
          "INSERT OR REPLACE INTO exam_packages (id, title, question_package_id, target_class, target_session, selected_student_ids, token, duration_minutes, is_active, subject_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          e.id, e.title, e.questionPackageId, e.targetClass, e.targetSession || 'ALL', 
          JSON.stringify(e.selectedStudentIds || []), e.token, e.durationMinutes || 70, e.isActive ? 1 : 0, e.subjectName || ''
        ).run();
      }
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 14. DELETE /api/exam-packages/:id
    const ePkgDeleteMatch = path.match(/^\/exam-packages\/([^\/]+)$/);
    if (method === 'DELETE' && ePkgDeleteMatch) {
      const examId = ePkgDeleteMatch[1];
      await env.DB.prepare("DELETE FROM exam_packages WHERE id = ?").bind(examId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 15. POST /api/staff-users
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

    // 16. DELETE /api/staff-users/:id
    const staffDeleteMatch = path.match(/^\/staff-users\/([^\/]+)$/);
    if (method === 'DELETE' && staffDeleteMatch) {
      const staffId = staffDeleteMatch[1];
      await env.DB.prepare("DELETE FROM staff_users WHERE id = ?").bind(staffId).run();
      return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 17. GET & POST & DELETE /api/subjects
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

    // 18. POST /api/cloudflare/query
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
