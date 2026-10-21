import { Student, Submission, Question } from '../types';

export const syncApi = {
  async getSyncData() {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        return { 
          isError: true, 
          error: errJson?.error || `HTTP ${res.status}: ${res.statusText}`,
          status: res.status 
        };
      }
      const data = await res.json();
      return { ...data, isError: false };
    } catch (e: any) {
      return { isError: true, error: e.message || 'Gagal menghubungi server', isNetworkError: true };
    }
  },

  async getSubmissions(): Promise<Submission[]> {
    try {
      const res = await fetch('/api/submissions');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API getSubmissions failed:", e);
    }
    return [];
  },

  async updateStudent(student: Partial<Student> & { id: string }) {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn(`API updateStudent error (${res.status}):`, text);
      }
    } catch (e) {
      console.warn("API updateStudent failed:", e);
    }
  },

  async updateStudents(students: Student[]) {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(students)
      });
    } catch (e) {
      console.warn("API updateStudents failed:", e);
    }
  },

  async deleteStudent(id: string) {
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteStudent failed:", e);
    }
  },

  async bulkDeleteStudents(ids: string[]) {
    try {
      await fetch('/api/students/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    } catch (e) {
      console.warn("API bulkDeleteStudents failed:", e);
    }
  },

  async addSubmission(submission: Submission): Promise<{ success: boolean; error?: string }> {
    let lastError = '';
    // Retry up to 3 times to ensure answer sheet is NEVER lost even on flaky mobile connection
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        });
        if (res.ok) {
          return { success: true };
        }
        const errJson = await res.json().catch(() => null);
        lastError = errJson?.error || `HTTP ${res.status}`;
        console.warn(`Attempt ${attempt} addSubmission failed (${res.status}):`, lastError);
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Attempt ${attempt} addSubmission network error:`, e);
      }
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }
    return { success: false, error: lastError };
  },

  async deleteSubmission(id: string) {
    try {
      await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteSubmission failed:", e);
    }
  },

  async updateQuestions(questions: Question[]) {
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questions)
      });
    } catch (e) {
      console.warn("API updateQuestions failed:", e);
    }
  },

  async deleteQuestion(id: string) {
    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteQuestion failed:", e);
    }
  },

  async updateQuestionPackages(packages: any[]) {
    try {
      await fetch('/api/question-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packages)
      });
    } catch (e) {
      console.warn("API updateQuestionPackages failed:", e);
    }
  },

  async deleteQuestionPackage(id: string) {
    try {
      await fetch(`/api/question-packages/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteQuestionPackage failed:", e);
    }
  },

  async updateExamPackages(packages: any[]) {
    try {
      await fetch('/api/exam-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packages)
      });
    } catch (e) {
      console.warn("API updateExamPackages failed:", e);
    }
  },

  async deleteExamPackage(id: string) {
    try {
      await fetch(`/api/exam-packages/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteExamPackage failed:", e);
    }
  },

  async updateConfig(config: { examToken?: string; unlockPin?: string; isExamActiveGlobal?: boolean; activeSession?: string }) {
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (e) {
      console.warn("API updateConfig failed:", e);
    }
  },

  async resetSession(session: string) {
    try {
      const res = await fetch('/api/students/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API resetSession failed:", e);
    }
    return null;
  },

  async setSessionAccess(session: string, examAllowed: boolean) {
    try {
      const res = await fetch('/api/students/session-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, examAllowed })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API setSessionAccess failed:", e);
    }
    return null;
  },

  async getStudentStatus(id: string) {
    try {
      const res = await fetch(`/api/student/${id}/status`);
      if (res.ok) return await res.json();
    } catch (e) {
      // ignore
    }
    return null;
  },

  async updateStaffUser(user: any) {
    try {
      await fetch('/api/staff-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (e) {
      console.warn("API updateStaffUser failed:", e);
    }
  },

  async updateStaffUsers(users: any[]) {
    try {
      await fetch('/api/staff-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
      });
    } catch (e) {
      console.warn("API updateStaffUsers failed:", e);
    }
  },

  async deleteStaffUser(id: string) {
    try {
      await fetch(`/api/staff-users/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteStaffUser failed:", e);
    }
  },

  async updateSubjects(subjects: string[]) {
    try {
      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjects)
      });
    } catch (e) {
      console.warn("API updateSubjects failed:", e);
    }
  },

  async addSubject(subjectName: string) {
    try {
      await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subjectName })
      });
    } catch (e) {
      console.warn("API addSubject failed:", e);
    }
  },

  async deleteSubject(subjectName: string) {
    try {
      await fetch(`/api/subjects/${encodeURIComponent(subjectName)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API deleteSubject failed:", e);
    }
  },

  // Cloudflare D1 Database APIs
  async getCloudflareStatus(test = false) {
    try {
      const res = await fetch(`/api/cloudflare/status${test ? '?test=true' : ''}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("getCloudflareStatus failed:", e);
    }
    return { isConfigured: false, config: {}, rawConfig: {} };
  },

  async saveCloudflareConfig(cfg: { accountId?: string; databaseId?: string; apiToken?: string }) {
    try {
      const res = await fetch('/api/cloudflare/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("saveCloudflareConfig failed:", e);
    }
    return { status: "error", message: "Gagal menyimpan konfigurasi" };
  },

  async initCloudflareSchema() {
    try {
      const res = await fetch('/api/cloudflare/init-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("initCloudflareSchema failed:", e);
    }
    return { success: false, message: "Gagal menghubungkan ke endpoint inisialisasi" };
  },

  async pushToCloudflare() {
    try {
      const res = await fetch('/api/cloudflare/sync-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("pushToCloudflare failed:", e);
    }
    return { success: false, message: "Gagal mengirim data ke Cloudflare D1" };
  },

  async pullFromCloudflare() {
    try {
      const res = await fetch('/api/cloudflare/sync-pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("pullFromCloudflare failed:", e);
    }
    return { success: false, message: "Gagal menarik data dari Cloudflare D1" };
  },

  async runCloudflareQuery(sql: string, params: any[] = []) {
    try {
      const res = await fetch('/api/cloudflare/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("runCloudflareQuery failed:", e);
    }
    return { success: false, error: "Gagal menjalankan query" };
  }
};

