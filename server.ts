import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_STUDENTS } from "./src/data/initialStudents";
import { DEFAULT_QUESTIONS } from "./src/data/defaultQuestions";
import { INITIAL_QUESTION_PACKAGES, INITIAL_EXAM_PACKAGES } from "./src/data/defaultPackages";
import { INITIAL_SUBMISSIONS } from "./src/data/initialSubmissions";
import { DEFAULT_SUBJECTS } from "./src/data/defaultSubjects";
import { cloudflareD1Server } from "./src/services/cloudflareD1Server";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

const INITIAL_STAFF_USERS = [
  { id: 'usr-admin', name: 'Khoirul (Administrator Utama)', username: 'admin', password: 'admin123', role: 'admin' },
  { id: 'usr-guru-1', name: 'Bpk. Ahmad Subandi, S.Pd (Guru Fisika)', username: 'gurufisika', password: 'guru123', role: 'guru', subject: 'Fisika' },
  { id: 'usr-guru-2', name: 'Ibu Ratna Dewi, M.Pd (Guru Matematika)', username: 'gurumatematika', password: 'guru123', role: 'guru', subject: 'Matematika' },
  { id: 'usr-pengawas-1', name: 'Pengawas Ruang 01 (Laboratorium Komputer)', username: 'pengawas1', password: 'pengawas123', role: 'pengawas' },
  { id: 'usr-pengawas-2', name: 'Pengawas Ruang 02 (Laboratorium IPA)', username: 'pengawas2', password: 'pengawas123', role: 'pengawas' }
];

// Server state
let state = {
  students: [...INITIAL_STUDENTS],
  submissions: [...INITIAL_SUBMISSIONS],
  questions: [...DEFAULT_QUESTIONS],
  questionPackages: [...INITIAL_QUESTION_PACKAGES],
  examPackages: [...INITIAL_EXAM_PACKAGES],
  staffUsers: [...INITIAL_STAFF_USERS],
  subjects: [...DEFAULT_SUBJECTS],
  config: {
    examToken: "FISIKA2026",
    unlockPin: "00000",
    isExamActiveGlobal: true,
    activeSession: "ALL",
    sessionSchedule: {
      session1: "07:30 - 09:00 WIB",
      break1: "09:00 - 10:00 WIB (Jeda 1 Jam)",
      session2: "10:00 - 11:30 WIB",
      break2: "11:30 - 12:30 WIB (Jeda 1 Jam)",
      session3: "12:30 - 14:00 WIB"
    }
  }
};

// SSE Clients for instant real-time sync
const sseClients = new Set<express.Response>();

function broadcastSync(type: string, payload: any) {
  const data = JSON.stringify({ type, payload, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}

// Throttled student broadcast to prevent quadratic event storms with 700 concurrent students
let studentUpdateTimer: NodeJS.Timeout | null = null;
function triggerThrottledStudentsBroadcast() {
  if (!studentUpdateTimer) {
    studentUpdateTimer = setTimeout(() => {
      studentUpdateTimer = null;
      broadcastSync("STUDENTS_UPDATED", state.students);
    }, 800);
  }
}

// SSE keep-alive interval
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(`: ping\n\n`);
    } catch (_) {
      sseClients.delete(client);
    }
  }
}, 25000);

// SSE endpoint
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  sseClients.add(res);

  // Send initial state upon connection
  res.write(`data: ${JSON.stringify({ type: "INIT", payload: state, timestamp: Date.now() })}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// Full state endpoint
app.get("/api/sync", (req, res) => {
  res.json(state);
});

// Lightweight student status check (saves bandwidth for 700 students)
app.get("/api/student/:id/status", (req, res) => {
  const { id } = req.params;
  const student = state.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json({
    status: "ok",
    student,
    config: state.config
  });
});

// Update / Upsert Students (Proteksi penuh identitas siswa agar tidak terhapus)
app.post("/api/students", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    incoming.forEach((s: any) => {
      if (!s || !s.id) return;
      const idx = state.students.findIndex((item) => item.id === s.id);
      const backup = INITIAL_STUDENTS.find((item) => item.id === s.id);
      if (idx >= 0) {
        state.students[idx] = {
          ...state.students[idx],
          ...s,
          name: (s.name && s.name.trim() !== '') ? s.name : (state.students[idx].name || backup?.name || ''),
          class: (s.class && s.class.trim() !== '') ? s.class : (state.students[idx].class || backup?.class || ''),
          username: (s.username && s.username.trim() !== '') ? s.username : (state.students[idx].username || backup?.username || ''),
          password: (s.password && s.password.trim() !== '') ? s.password : (state.students[idx].password || backup?.password || '123'),
          session: (s.session && s.session.trim() !== '') ? s.session : (state.students[idx].session || backup?.session || 'Sesi 1'),
        };
        cloudflareD1Server.persistStudentAsync(state.students[idx]);
      } else {
        const fullNew = {
          ...s,
          name: (s.name && s.name.trim() !== '') ? s.name : (backup?.name || `Siswa ${s.id}`),
          class: (s.class && s.class.trim() !== '') ? s.class : (backup?.class || 'X A'),
          username: (s.username && s.username.trim() !== '') ? s.username : (backup?.username || s.id),
          password: (s.password && s.password.trim() !== '') ? s.password : (backup?.password || '123'),
          session: (s.session && s.session.trim() !== '') ? s.session : (backup?.session || 'Sesi 1'),
        };
        state.students.push(fullNew);
        cloudflareD1Server.persistStudentAsync(fullNew);
      }
    });
    triggerThrottledStudentsBroadcast();
  } else if (incoming && incoming.id) {
    const idx = state.students.findIndex((item) => item.id === incoming.id);
    const backup = INITIAL_STUDENTS.find((item) => item.id === incoming.id);
    let fullStudent: any;
    if (idx >= 0) {
      state.students[idx] = {
        ...state.students[idx],
        ...incoming,
        name: (incoming.name && incoming.name.trim() !== '') ? incoming.name : (state.students[idx].name || backup?.name || ''),
        class: (incoming.class && incoming.class.trim() !== '') ? incoming.class : (state.students[idx].class || backup?.class || ''),
        username: (incoming.username && incoming.username.trim() !== '') ? incoming.username : (state.students[idx].username || backup?.username || ''),
        password: (incoming.password && incoming.password.trim() !== '') ? incoming.password : (state.students[idx].password || backup?.password || '123'),
        session: (incoming.session && incoming.session.trim() !== '') ? incoming.session : (state.students[idx].session || backup?.session || 'Sesi 1'),
      };
      fullStudent = state.students[idx];
    } else {
      fullStudent = {
        ...incoming,
        name: (incoming.name && incoming.name.trim() !== '') ? incoming.name : (backup?.name || `Siswa ${incoming.id}`),
        class: (incoming.class && incoming.class.trim() !== '') ? incoming.class : (backup?.class || 'X A'),
        username: (incoming.username && incoming.username.trim() !== '') ? incoming.username : (backup?.username || incoming.id),
        password: (incoming.password && incoming.password.trim() !== '') ? incoming.password : (backup?.password || '123'),
        session: (incoming.session && incoming.session.trim() !== '') ? incoming.session : (backup?.session || 'Sesi 1'),
      };
      state.students.push(fullStudent);
    }
    cloudflareD1Server.persistStudentAsync(fullStudent);
    triggerThrottledStudentsBroadcast();
  }
  res.json({ status: "ok" });
});

// Reset Session (Used between sessions during the 1-hour break)
app.post("/api/students/reset-session", (req, res) => {
  const { session } = req.body; // 'Sesi 1' | 'Sesi 2' | 'Sesi 3' | 'ALL'
  state.students = state.students.map((s) => {
    if (session === 'ALL' || s.session === session) {
      return {
        ...s,
        status: 'idle',
        examAllowed: true,
        violationCount: 0,
        lastViolationReason: '',
        savedAnswers: {},
        savedDoubtful: {},
        savedTimeLeft: undefined,
        currentQuestionIdx: 0,
        lastActiveAt: new Date().toISOString()
      };
    }
    return s;
  });
  broadcastSync("STUDENTS_UPDATED", state.students);
  res.json({ status: "ok", students: state.students });
});

// Session-level Bulk Access Control
app.post("/api/students/session-access", (req, res) => {
  const { session, examAllowed } = req.body;
  state.students = state.students.map((s) => {
    if (session === 'ALL' || s.session === session) {
      return { ...s, examAllowed: Boolean(examAllowed) };
    }
    return s;
  });
  broadcastSync("STUDENTS_UPDATED", state.students);
  res.json({ status: "ok", students: state.students });
});

// Delete Student
app.delete("/api/students/:id", (req, res) => {
  const { id } = req.params;
  state.students = state.students.filter((s) => s.id !== id);
  broadcastSync("STUDENTS_UPDATED", state.students);
  res.json({ status: "ok", students: state.students });
});

// Bulk Delete Students
app.post("/api/students/bulk-delete", (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    state.students = state.students.filter((s) => !ids.includes(s.id));
  }
  broadcastSync("STUDENTS_UPDATED", state.students);
  res.json({ status: "ok", students: state.students });
});

// Explicit file download endpoint for cbt-sman1toili-siap-deploy.zip
app.get("/api/download-zip", (req, res) => {
  const zipPath = path.join(process.cwd(), "public", "cbt-sman1toili-siap-deploy.zip");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="cbt-sman1toili-siap-deploy.zip"');
  res.download(zipPath, "cbt-sman1toili-siap-deploy.zip");
});

// Submissions
app.get("/api/submissions", (req, res) => {
  res.json(state.submissions);
});

app.post("/api/submissions", (req, res) => {
  const submission = req.body;
  if (submission && submission.id) {
    // If student identity is missing or empty, find from state.students or INITIAL_STUDENTS
    const std = state.students.find((s) => s.id === submission.studentId) || 
                INITIAL_STUDENTS.find((s) => s.id === submission.studentId);
    if (std) {
      if (!submission.studentName || String(submission.studentName).trim() === '') submission.studentName = std.name;
      if (!submission.studentClass || String(submission.studentClass).trim() === '') submission.studentClass = std.class;
      if (!submission.username || String(submission.username).trim() === '') submission.username = std.username;
      if (!submission.session || String(submission.session).trim() === '') submission.session = std.session;
    }

    const idx = state.submissions.findIndex((s) => s.id === submission.id);
    if (idx >= 0) {
      state.submissions[idx] = submission;
    } else {
      state.submissions.unshift(submission);
    }
    if (submission.studentId) {
      const stdIdx = state.students.findIndex((s) => s.id === submission.studentId);
      if (stdIdx >= 0) {
        state.students[stdIdx].status = 'completed';
        state.students[stdIdx].examAllowed = false;
        // Also heal student name if empty
        if ((!state.students[stdIdx].name || String(state.students[stdIdx].name).trim() === '') && submission.studentName) {
          state.students[stdIdx].name = submission.studentName;
          state.students[stdIdx].class = submission.studentClass || state.students[stdIdx].class;
          state.students[stdIdx].username = submission.username || state.students[stdIdx].username;
        }
        broadcastSync("STUDENTS_UPDATED", state.students);
        cloudflareD1Server.persistStudentAsync(state.students[stdIdx]);
      }
    }
    cloudflareD1Server.persistSubmissionAsync(submission);
    broadcastSync("SUBMISSIONS_UPDATED", state.submissions);
  }
  res.json({ status: "ok", submissions: state.submissions });
});

// Delete Submission
app.delete("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  state.submissions = state.submissions.filter((s) => s.id !== id);
  broadcastSync("SUBMISSIONS_UPDATED", state.submissions);
  res.json({ status: "ok", submissions: state.submissions });
});

// Questions
app.post("/api/questions", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    state.questions = incoming;
  } else if (incoming && incoming.id) {
    const idx = state.questions.findIndex((q) => String(q.id) === String(incoming.id));
    if (idx >= 0) {
      state.questions[idx] = incoming;
    } else {
      state.questions.push(incoming);
    }
  }
  broadcastSync("QUESTIONS_UPDATED", state.questions);
  res.json({ status: "ok", questions: state.questions });
});

// Delete Question
app.delete("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  state.questions = state.questions.filter((q) => String(q.id) !== String(id));
  broadcastSync("QUESTIONS_UPDATED", state.questions);
  res.json({ status: "ok", questions: state.questions });
});

// Config
app.post("/api/config", (req, res) => {
  state.config = { ...state.config, ...req.body };
  broadcastSync("CONFIG_UPDATED", state.config);
  res.json({ status: "ok", config: state.config });
});

// Question Packages
app.post("/api/question-packages", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    state.questionPackages = incoming;
  } else if (incoming && incoming.id) {
    const idx = state.questionPackages.findIndex((p) => String(p.id) === String(incoming.id));
    if (idx >= 0) {
      state.questionPackages[idx] = incoming;
    } else {
      state.questionPackages.push(incoming);
    }
  }
  broadcastSync("QUESTION_PACKAGES_UPDATED", state.questionPackages);
  res.json({ status: "ok", questionPackages: state.questionPackages });
});

app.delete("/api/question-packages/:id", (req, res) => {
  const { id } = req.params;
  state.questionPackages = state.questionPackages.filter((p) => String(p.id) !== String(id));
  broadcastSync("QUESTION_PACKAGES_UPDATED", state.questionPackages);
  res.json({ status: "ok", questionPackages: state.questionPackages });
});

// Exam Packages
app.post("/api/exam-packages", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    state.examPackages = incoming;
  } else if (incoming && incoming.id) {
    const idx = state.examPackages.findIndex((e) => String(e.id) === String(incoming.id));
    if (idx >= 0) {
      state.examPackages[idx] = incoming;
    } else {
      state.examPackages.push(incoming);
    }
  }
  broadcastSync("EXAM_PACKAGES_UPDATED", state.examPackages);
  res.json({ status: "ok", examPackages: state.examPackages });
});

app.delete("/api/exam-packages/:id", (req, res) => {
  const { id } = req.params;
  state.examPackages = state.examPackages.filter((e) => String(e.id) !== String(id));
  broadcastSync("EXAM_PACKAGES_UPDATED", state.examPackages);
  res.json({ status: "ok", examPackages: state.examPackages });
});

// Staff Users (Admin, Guru, Pengawas)
app.post("/api/staff-users", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    state.staffUsers = incoming;
  } else if (incoming && incoming.id) {
    const idx = state.staffUsers.findIndex((u) => String(u.id) === String(incoming.id));
    if (idx >= 0) {
      state.staffUsers[idx] = incoming;
    } else {
      state.staffUsers.push(incoming);
    }
  }
  broadcastSync("STAFF_USERS_UPDATED", state.staffUsers);
  res.json({ status: "ok", staffUsers: state.staffUsers });
});

app.delete("/api/staff-users/:id", (req, res) => {
  const { id } = req.params;
  state.staffUsers = state.staffUsers.filter((u) => String(u.id) !== String(id));
  broadcastSync("STAFF_USERS_UPDATED", state.staffUsers);
  res.json({ status: "ok", staffUsers: state.staffUsers });
});

// Master Data Mata Pelajaran (Subjects)
app.get("/api/subjects", (req, res) => {
  res.json(state.subjects);
});

app.post("/api/subjects", (req, res) => {
  const incoming = req.body;
  if (Array.isArray(incoming)) {
    const unique = Array.from(new Set(incoming.map((s: any) => String(s).trim()).filter(Boolean)));
    state.subjects = unique;
  } else if (incoming && incoming.name) {
    const trimmed = String(incoming.name).trim();
    if (trimmed && !state.subjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      state.subjects.push(trimmed);
    }
  }
  broadcastSync("SUBJECTS_UPDATED", state.subjects);
  res.json({ status: "ok", subjects: state.subjects });
});

app.delete("/api/subjects/:name", (req, res) => {
  const { name } = req.params;
  const decoded = decodeURIComponent(name).toLowerCase();
  state.subjects = state.subjects.filter((s) => s.toLowerCase() !== decoded);
  broadcastSync("SUBJECTS_UPDATED", state.subjects);
  res.json({ status: "ok", subjects: state.subjects });
});

// ==========================================
// Cloudflare D1 Database Integration APIs
// ==========================================

app.get("/api/cloudflare/status", async (req, res) => {
  const isConfigured = cloudflareD1Server.isConfigured();
  const config = cloudflareD1Server.getConfig();
  let testResult = null;

  if (isConfigured && req.query.test === "true") {
    testResult = await cloudflareD1Server.testConnection();
  }

  res.json({
    status: "ok",
    isConfigured,
    config: {
      accountId: config.accountId ? `${config.accountId.slice(0, 4)}...${config.accountId.slice(-4)}` : '',
      databaseId: config.databaseId ? `${config.databaseId.slice(0, 8)}...` : '',
      hasToken: Boolean(config.apiToken)
    },
    rawConfig: {
      accountId: config.accountId || '',
      databaseId: config.databaseId || '',
      apiToken: config.apiToken || ''
    },
    testResult
  });
});

app.post("/api/cloudflare/config", async (req, res) => {
  const { accountId, databaseId, apiToken } = req.body;
  cloudflareD1Server.setConfig({
    accountId: accountId !== undefined ? String(accountId).trim() : undefined,
    databaseId: databaseId !== undefined ? String(databaseId).trim() : undefined,
    apiToken: apiToken !== undefined ? String(apiToken).trim() : undefined
  });

  const testResult = await cloudflareD1Server.testConnection();
  res.json({
    status: "ok",
    isConfigured: cloudflareD1Server.isConfigured(),
    testResult
  });
});

app.post("/api/cloudflare/init-schema", async (req, res) => {
  const result = await cloudflareD1Server.initSchema();
  res.json(result);
});

app.post("/api/cloudflare/sync-push", async (req, res) => {
  const result = await cloudflareD1Server.pushState(state);
  res.json(result);
});

app.post("/api/cloudflare/sync-pull", async (req, res) => {
  const result = await cloudflareD1Server.pullState();
  if (result.success && result.data) {
    if (result.data.students?.length) {
      // Auto-heal any empty names
      state.students = result.data.students.map((s: any) => {
        if (!s.name || s.name.trim() === '') {
          const backup = INITIAL_STUDENTS.find((b) => b.id === s.id);
          if (backup) {
            return {
              ...s,
              name: backup.name,
              class: s.class || backup.class,
              username: s.username || backup.username,
              password: s.password || backup.password,
              session: s.session || backup.session
            };
          }
        }
        return s;
      });
    }

    if (result.data.submissions?.length) {
      // Auto-heal any empty submission names from state.students or INITIAL_STUDENTS
      state.submissions = result.data.submissions.map((sub: any) => {
        if (!sub.studentName || sub.studentName.trim() === '') {
          const std = state.students.find((s) => s.id === sub.studentId) ||
                      INITIAL_STUDENTS.find((s) => s.id === sub.studentId);
          if (std) {
            return {
              ...sub,
              studentName: std.name || sub.studentName,
              studentClass: std.class || sub.studentClass,
              username: std.username || sub.username,
              session: sub.session || std.session
            };
          }
        }
        return sub;
      });
    }

    if (result.data.questionPackages?.length) state.questionPackages = result.data.questionPackages;
    if (result.data.examPackages?.length) state.examPackages = result.data.examPackages;
    if (result.data.subjects?.length) state.subjects = result.data.subjects;
    if (result.data.staffUsers?.length) state.staffUsers = result.data.staffUsers;
    if (result.data.config) state.config = result.data.config;

    broadcastSync("INIT", state);
  }
  res.json(result);
});

app.post("/api/cloudflare/query", async (req, res) => {
  const { sql, params } = req.body;
  if (!sql) {
    return res.status(400).json({ success: false, error: "SQL query wajib diisi" });
  }
  const result = await cloudflareD1Server.query(sql, params || []);
  res.json(result);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Attempt to hydrate state from Cloudflare D1 if credentials exist in env
  if (cloudflareD1Server.isConfigured()) {
    console.log("Cloudflare D1 is configured, checking database connection...");
    cloudflareD1Server.pullState().then(res => {
      if (res.success && res.data) {
        if (res.data.students?.length) state.students = res.data.students;
        if (res.data.submissions?.length) state.submissions = res.data.submissions;
        if (res.data.questionPackages?.length) state.questionPackages = res.data.questionPackages;
        if (res.data.examPackages?.length) state.examPackages = res.data.examPackages;
        if (res.data.subjects?.length) state.subjects = res.data.subjects;
        if (res.data.staffUsers?.length) state.staffUsers = res.data.staffUsers;
        if (res.data.config) state.config = res.data.config;
        console.log("Successfully hydrated state from Cloudflare D1.");
      }
    }).catch(err => console.warn("Failed to load initial state from Cloudflare D1:", err));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
