-- ==============================================================
-- SKEMA DATABASE CLOUDFLARE D1 UNTUK CBT SMAN 1 TOILI
-- Jalankan query ini di Cloudflare Dashboard > Workers & D1 > D1 > Console
-- atau via Wrangler CLI: npx wrangler d1 execute cbt-db --file=./cloudflare_d1_schema.sql
-- ==============================================================

-- 1. Tabel Siswa (Students)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    exam_allowed INTEGER DEFAULT 1, -- 1 = true, 0 = false
    status TEXT DEFAULT 'idle',     -- 'idle', 'active', 'suspended', 'completed', 'force_submitted'
    violation_count INTEGER DEFAULT 0,
    last_violation_reason TEXT DEFAULT '',
    session TEXT DEFAULT 'Sesi 1',  -- 'Sesi 1', 'Sesi 2', 'Sesi 3'
    saved_answers TEXT DEFAULT '{}',  -- JSON string { "0": 1, "1": 3 }
    saved_doubtful TEXT DEFAULT '{}', -- JSON string { "0": true }
    saved_time_left INTEGER,
    current_question_idx INTEGER DEFAULT 0,
    last_active_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Mata Pelajaran (Subjects)
CREATE TABLE IF NOT EXISTS subjects (
    name TEXT PRIMARY KEY,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Paket Soal (Question Packages)
CREATE TABLE IF NOT EXISTS question_packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    target_class TEXT NOT NULL,
    description TEXT,
    questions_json TEXT NOT NULL DEFAULT '[]', -- JSON array berisi daftar soal dan opsi
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Paket Ujian (Exam Packages)
CREATE TABLE IF NOT EXISTS exam_packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    question_package_id TEXT NOT NULL,
    target_class TEXT NOT NULL,
    target_session TEXT DEFAULT 'ALL',
    selected_student_ids TEXT DEFAULT '[]', -- JSON array of student IDs
    token TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 70,
    is_active INTEGER DEFAULT 1,
    subject_name TEXT,
    start_date TEXT,
    start_time TEXT,
    end_date TEXT,
    end_time TEXT,
    enable_schedule INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_package_id) REFERENCES question_packages(id)
);

-- 5. Tabel Hasil Ujian / Submisi (Submissions)
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    username TEXT NOT NULL,
    session TEXT,
    answers_json TEXT NOT NULL, -- JSON string jawaban
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    score REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    is_forced INTEGER DEFAULT 0,
    subject_name TEXT,
    exam_title TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Pengguna Staf (Staff Users: Admin, Guru, Pengawas)
CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'guru', 'pengawas'
    subject TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Konfigurasi Global CBT
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- ==============================================================
-- DATA AWAL (SEED DATA DEFAULT)
-- ==============================================================

-- Seed Mata Pelajaran
INSERT OR IGNORE INTO subjects (name) VALUES 
('Fisika'), ('Matematika'), ('Biologi'), ('Kimia'), 
('Bahasa Indonesia'), ('Bahasa Inggris'), ('Sejarah'), 
('Ekonomi'), ('Geografi'), ('Sosiologi'), ('PPKn'), ('PAI');

-- Seed Akun Staf Awal
INSERT OR IGNORE INTO staff_users (id, name, username, password, role, subject) VALUES 
('usr-admin', 'Khoirul (Administrator Utama)', 'admin', 'admin123', 'admin', NULL),
('usr-guru-1', 'Bpk. Ahmad Subandi, S.Pd (Guru Fisika)', 'gurufisika', 'guru123', 'guru', 'Fisika'),
('usr-guru-2', 'Ibu Ratna Dewi, M.Pd (Guru Matematika)', 'gurumatematika', 'guru123', 'guru', 'Matematika'),
('usr-pengawas-1', 'Pengawas Ruang 01 (Laboratorium Komputer)', 'pengawas1', 'pengawas123', 'pengawas', NULL),
('usr-pengawas-2', 'Pengawas Ruang 02 (Laboratorium IPA)', 'pengawas2', 'pengawas123', 'pengawas', NULL);

-- Seed Konfigurasi Sistem
INSERT OR IGNORE INTO app_config (key, value) VALUES 
('exam_token', 'FISIKA2026'),
('unlock_pin', '00000'),
('is_exam_active_global', '1'),
('active_session', 'ALL');

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_session ON students(session);
CREATE INDEX IF NOT EXISTS idx_submissions_class ON submissions(student_class);
CREATE INDEX IF NOT EXISTS idx_submissions_subject ON submissions(subject_name);

-- Pemulihan Otomatis Data Submisi yang namanya kosong (Heal Missing Student Names in Submissions)
UPDATE submissions 
SET 
  student_name = COALESCE((SELECT name FROM students WHERE students.id = submissions.student_id AND students.name != ''), student_name),
  student_class = COALESCE((SELECT class FROM students WHERE students.id = submissions.student_id AND students.class != ''), student_class),
  username = COALESCE((SELECT username FROM students WHERE students.id = submissions.student_id AND students.username != ''), submissions.username)
WHERE student_name = '' OR student_name IS NULL;
