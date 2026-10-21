// Service adapter untuk integrasi Cloudflare D1 REST API
// Menggunakan API resmi Cloudflare D1: https://developers.cloudflare.com/api/operations/cloudflare-d1-query-database

export interface CloudflareConfig {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

let activeConfig: CloudflareConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || ''
};

export const cloudflareD1Server = {
  getConfig(): CloudflareConfig {
    return { ...activeConfig };
  },

  cleanToken(raw: string): string {
    if (!raw) return '';
    let t = raw.trim();
    const match = t.match(/Bearer\s+([A-Za-z0-9_\-]+)/i);
    if (match) return match[1].trim();
    if (t.toLowerCase().startsWith('bearer ')) {
      t = t.slice(7).trim();
    }
    return t.replace(/["']/g, '');
  },

  setConfig(cfg: Partial<CloudflareConfig>) {
    activeConfig = {
      ...activeConfig,
      ...cfg,
      apiToken: cfg.apiToken !== undefined ? this.cleanToken(cfg.apiToken) : activeConfig.apiToken,
      accountId: cfg.accountId !== undefined ? cfg.accountId.trim().replace(/["']/g, '') : activeConfig.accountId,
      databaseId: cfg.databaseId !== undefined ? cfg.databaseId.trim().replace(/["']/g, '') : activeConfig.databaseId
    };
  },

  isConfigured(): boolean {
    return Boolean(
      activeConfig.accountId?.trim() && 
      activeConfig.databaseId?.trim() && 
      activeConfig.apiToken?.trim()
    );
  },

  async query(sql: string, params: any[] = []): Promise<{ success: boolean; results?: any[]; error?: string; meta?: any }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Kredensial Cloudflare D1 belum dikonfigurasi.' };
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${activeConfig.accountId.trim()}/d1/database/${activeConfig.databaseId.trim()}/query`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeConfig.apiToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql,
          params
        })
      });

      const data: any = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.errors?.map((e: any) => e.message || JSON.stringify(e)).join(', ') || `HTTP ${res.status}: ${res.statusText}`;
        return { success: false, error: errorMsg };
      }

      const firstResult = data.result?.[0] || {};
      return {
        success: true,
        results: firstResult.results || [],
        meta: firstResult.meta
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menghubungi server Cloudflare API' };
    }
  },

  async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number; data?: any }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Kredensial Cloudflare D1 belum lengkap (Account ID, Database ID, atau API Token masih kosong).'
      };
    }

    const start = Date.now();
    const res = await this.query("SELECT 1 as test, datetime('now') as cf_time;");
    const latencyMs = Date.now() - start;

    if (res.success) {
      return {
        success: true,
        message: `Terhubung dengan sukses ke Cloudflare D1! (Respon dalam ${latencyMs} ms)`,
        latencyMs,
        data: res.results?.[0]
      };
    } else {
      return {
        success: false,
        message: `Gagal terhubung: ${res.error}`
      };
    }
  },

  async initSchema(): Promise<{ success: boolean; message: string; executedCount: number }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Kredensial Cloudflare D1 belum dikonfigurasi.', executedCount: 0 };
    }

    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS students (
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
      );`,
      `CREATE TABLE IF NOT EXISTS subjects (
        name TEXT PRIMARY KEY,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS question_packages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        target_class TEXT NOT NULL,
        description TEXT,
        questions_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS exam_packages (
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
      );`,
      `CREATE TABLE IF NOT EXISTS submissions (
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
      );`,
      `CREATE TABLE IF NOT EXISTS staff_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        subject TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`
    ];

    let executed = 0;
    for (const sql of ddlStatements) {
      const res = await this.query(sql);
      if (!res.success) {
        return {
          success: false,
          message: `Gagal pada statement: ${sql.slice(0, 40)}... Error: ${res.error}`,
          executedCount: executed
        };
      }
      executed++;
    }

    return {
      success: true,
      message: `Berhasil menginisialisasi ${executed} tabel di Cloudflare D1!`,
      executedCount: executed
    };
  },

  async pushState(state: any): Promise<{ success: boolean; message: string; stats: any }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Cloudflare D1 belum dikonfigurasi.', stats: null };
    }

    const stats = {
      students: 0,
      subjects: 0,
      questionPackages: 0,
      examPackages: 0,
      submissions: 0,
      staffUsers: 0
    };

    try {
      // 1. Subjects
      if (Array.isArray(state.subjects)) {
        for (const sub of state.subjects) {
          await this.query(
            "INSERT OR REPLACE INTO subjects (name) VALUES (?);",
            [sub]
          );
          stats.subjects++;
        }
      }

      // 2. Staff Users
      if (Array.isArray(state.staffUsers)) {
        for (const u of state.staffUsers) {
          await this.query(
            "INSERT OR REPLACE INTO staff_users (id, name, username, password, role, subject) VALUES (?, ?, ?, ?, ?, ?);",
            [u.id, u.name, u.username, u.password, u.role, u.subject || null]
          );
          stats.staffUsers++;
        }
      }

      // 3. Question Packages
      if (Array.isArray(state.questionPackages)) {
        for (const p of state.questionPackages) {
          await this.query(
            "INSERT OR REPLACE INTO question_packages (id, title, subject, target_class, description, questions_json) VALUES (?, ?, ?, ?, ?, ?);",
            [p.id, p.title, p.subject, p.targetClass, p.description || '', JSON.stringify(p.questions || [])]
          );
          stats.questionPackages++;
        }
      }

      // 4. Exam Packages
      if (Array.isArray(state.examPackages)) {
        for (const e of state.examPackages) {
          await this.query(
            "INSERT OR REPLACE INTO exam_packages (id, title, question_package_id, target_class, target_session, selected_student_ids, token, duration_minutes, is_active, subject_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
            [
              e.id, 
              e.title, 
              e.questionPackageId, 
              e.targetClass, 
              e.targetSession || 'ALL', 
              JSON.stringify(e.selectedStudentIds || []), 
              e.token, 
              e.durationMinutes || 70, 
              e.isActive ? 1 : 0, 
              e.subjectName || ''
            ]
          );
          stats.examPackages++;
        }
      }

      // 5. Students (in chunks if needed)
      if (Array.isArray(state.students)) {
        for (const s of state.students) {
          await this.query(
            `INSERT OR REPLACE INTO students 
            (id, name, class, username, password, exam_allowed, status, violation_count, last_violation_reason, session, saved_answers, saved_doubtful, saved_time_left, current_question_idx, last_active_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              s.id,
              s.name,
              s.class,
              s.username,
              s.password,
              s.examAllowed ? 1 : 0,
              s.status || 'idle',
              s.violationCount || 0,
              s.lastViolationReason || '',
              s.session || 'Sesi 1',
              JSON.stringify(s.savedAnswers || {}),
              JSON.stringify(s.savedDoubtful || {}),
              s.savedTimeLeft ?? null,
              s.currentQuestionIdx || 0,
              s.lastActiveAt || null
            ]
          );
          stats.students++;
        }
      }

      // 6. Submissions
      if (Array.isArray(state.submissions)) {
        for (const sub of state.submissions) {
          await this.query(
            `INSERT OR REPLACE INTO submissions 
            (id, student_id, student_name, student_class, username, session, answers_json, correct, wrong, score, submitted_at, is_forced, subject_name, exam_title) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
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
              sub.submittedAt,
              sub.isForced ? 1 : 0,
              sub.subjectName || '',
              sub.examTitle || ''
            ]
          );
          stats.submissions++;
        }
      }

      // 7. Config
      if (state.config) {
        await this.query("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?);", ['config', JSON.stringify(state.config)]);
      }

      return {
        success: true,
        message: `Sinkronisasi ke Cloudflare D1 selesai! Berhasil push ${stats.students} siswa, ${stats.submissions} nilai ujian, ${stats.questionPackages} paket soal, dll.`,
        stats
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal sync data ke Cloudflare D1: ${err.message}`,
        stats
      };
    }
  },

  async pullState(): Promise<{ success: boolean; data?: any; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Cloudflare D1 belum dikonfigurasi.' };
    }

    try {
      const [
        studentsRes,
        subjectsRes,
        questionPkgsRes,
        examPkgsRes,
        submissionsRes,
        staffRes,
        configRes
      ] = await Promise.all([
        this.query("SELECT * FROM students;"),
        this.query("SELECT * FROM subjects;"),
        this.query("SELECT * FROM question_packages;"),
        this.query("SELECT * FROM exam_packages;"),
        this.query("SELECT * FROM submissions ORDER BY submitted_at DESC;"),
        this.query("SELECT * FROM staff_users;"),
        this.query("SELECT * FROM app_config WHERE key = 'config';")
      ]);

      const parsedStudents = (studentsRes.results || []).map((row: any) => ({
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

      const parsedSubjects = (subjectsRes.results || []).map((r: any) => r.name);

      const parsedQuestionPackages = (questionPkgsRes.results || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        subject: row.subject,
        targetClass: row.target_class,
        description: row.description,
        questions: row.questions_json ? JSON.parse(row.questions_json) : [],
        createdAt: row.created_at
      }));

      const parsedExamPackages = (examPkgsRes.results || []).map((row: any) => ({
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

      const parsedSubmissions = (submissionsRes.results || []).map((row: any) => ({
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

      const parsedStaffUsers = (staffRes.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        password: row.password,
        role: row.role,
        subject: row.subject,
        createdAt: row.created_at
      }));

      let parsedConfig = null;
      if (configRes.results && configRes.results.length > 0 && configRes.results[0].value) {
        try {
          parsedConfig = JSON.parse(configRes.results[0].value);
        } catch (_) {}
      }

      return {
        success: true,
        message: `Berhasil menarik ${parsedStudents.length} siswa, ${parsedSubmissions.length} nilai, dan ${parsedQuestionPackages.length} paket soal dari Cloudflare D1.`,
        data: {
          students: parsedStudents,
          subjects: parsedSubjects.length > 0 ? parsedSubjects : undefined,
          questionPackages: parsedQuestionPackages.length > 0 ? parsedQuestionPackages : undefined,
          examPackages: parsedExamPackages.length > 0 ? parsedExamPackages : undefined,
          submissions: parsedSubmissions,
          staffUsers: parsedStaffUsers.length > 0 ? parsedStaffUsers : undefined,
          config: parsedConfig
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal membaca data dari Cloudflare D1: ${err.message}`
      };
    }
  },

  // Background persistence helper: Upsert single student to Cloudflare D1 (Aman tanpa menghapus identitas)
  persistStudentAsync(student: any) {
    if (!this.isConfigured() || !student?.id) return;
    this.query(
      `INSERT INTO students 
      (id, name, class, username, password, exam_allowed, status, violation_count, last_violation_reason, session, saved_answers, saved_doubtful, saved_time_left, current_question_idx, last_active_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = CASE WHEN excluded.name IS NOT NULL AND excluded.name != '' THEN excluded.name ELSE students.name END,
        class = CASE WHEN excluded.class IS NOT NULL AND excluded.class != '' THEN excluded.class ELSE students.class END,
        username = CASE WHEN excluded.username IS NOT NULL AND excluded.username != '' THEN excluded.username ELSE students.username END,
        password = CASE WHEN excluded.password IS NOT NULL AND excluded.password != '' THEN excluded.password ELSE students.password END,
        session = CASE WHEN excluded.session IS NOT NULL AND excluded.session != '' THEN excluded.session ELSE students.session END,
        exam_allowed = excluded.exam_allowed,
        status = excluded.status,
        violation_count = excluded.violation_count,
        last_violation_reason = excluded.last_violation_reason,
        saved_answers = CASE WHEN excluded.saved_answers IS NOT NULL AND excluded.saved_answers != '{}' THEN excluded.saved_answers ELSE students.saved_answers END,
        saved_doubtful = CASE WHEN excluded.saved_doubtful IS NOT NULL AND excluded.saved_doubtful != '{}' THEN excluded.saved_doubtful ELSE students.saved_doubtful END,
        saved_time_left = coalesce(excluded.saved_time_left, students.saved_time_left),
        current_question_idx = excluded.current_question_idx,
        last_active_at = excluded.last_active_at;`,
      [
        student.id,
        student.name || '',
        student.class || '',
        student.username || '',
        student.password || '',
        student.examAllowed ? 1 : 0,
        student.status || 'idle',
        student.violationCount || 0,
        student.lastViolationReason || '',
        student.session || 'Sesi 1',
        JSON.stringify(student.savedAnswers || {}),
        JSON.stringify(student.savedDoubtful || {}),
        student.savedTimeLeft ?? null,
        student.currentQuestionIdx || 0,
        student.lastActiveAt || new Date().toISOString()
      ]
    ).catch(e => console.warn('Cloudflare D1 student persist failed:', e));
  },

  // Background persistence helper: Upsert single submission to Cloudflare D1
  persistSubmissionAsync(submission: any) {
    if (!this.isConfigured() || !submission?.id) return;
    this.query(
      `INSERT INTO submissions 
      (id, student_id, student_name, student_class, username, session, answers_json, correct, wrong, score, submitted_at, is_forced, subject_name, exam_title) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        student_name = CASE WHEN excluded.student_name IS NOT NULL AND excluded.student_name != '' THEN excluded.student_name ELSE submissions.student_name END,
        student_class = CASE WHEN excluded.student_class IS NOT NULL AND excluded.student_class != '' THEN excluded.student_class ELSE submissions.student_class END,
        username = CASE WHEN excluded.username IS NOT NULL AND excluded.username != '' THEN excluded.username ELSE submissions.username END,
        session = CASE WHEN excluded.session IS NOT NULL AND excluded.session != '' THEN excluded.session ELSE submissions.session END,
        answers_json = excluded.answers_json,
        correct = excluded.correct,
        wrong = excluded.wrong,
        score = excluded.score,
        submitted_at = excluded.submitted_at,
        is_forced = excluded.is_forced,
        subject_name = CASE WHEN excluded.subject_name IS NOT NULL AND excluded.subject_name != '' THEN excluded.subject_name ELSE submissions.subject_name END,
        exam_title = CASE WHEN excluded.exam_title IS NOT NULL AND excluded.exam_title != '' THEN excluded.exam_title ELSE submissions.exam_title END;`,
      [
        submission.id,
        submission.studentId || '',
        submission.studentName || '',
        submission.studentClass || '',
        submission.username || '',
        submission.session || '',
        JSON.stringify(submission.answers || {}),
        Number(submission.correct) || 0,
        Number(submission.wrong) || 0,
        Number(submission.score) || 0,
        submission.submittedAt || new Date().toISOString(),
        submission.isForced ? 1 : 0,
        submission.subjectName || '',
        submission.examTitle || ''
      ]
    ).catch(e => console.warn('Cloudflare D1 submission persist failed:', e));
  }
};
