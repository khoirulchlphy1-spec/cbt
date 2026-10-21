import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Printer, Filter, Search, Award, CheckCircle, 
  AlertCircle, Users, BarChart3, ChevronRight, Eye, Trash2, BookOpen, 
  GraduationCap, Calendar, RefreshCw
} from 'lucide-react';
import { Submission, QuestionPackage, ExamPackage, Student, StaffRole } from '../types';

interface ExamArchiveViewProps {
  submissions: Submission[];
  questionPackages: QuestionPackage[];
  examPackages: ExamPackage[];
  students: Student[];
  staffRole: StaffRole;
  currentSubject?: string;
  isGeneratingPDF: boolean;
  onDownloadPdf: (elementId: string, filename: string) => void;
  onViewDetail: (sub: Submission) => void;
  onDeleteSubmission?: (id: string) => void;
}

export function ExamArchiveView({
  submissions,
  questionPackages,
  examPackages,
  students,
  staffRole,
  currentSubject,
  isGeneratingPDF,
  onDownloadPdf,
  onViewDetail,
  onDeleteSubmission
}: ExamArchiveViewProps) {
  // Extract all unique subjects
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach(s => { if (s.subjectName) set.add(s.subjectName); });
    questionPackages.forEach(q => { if (q.subject) set.add(q.subject); });
    examPackages.forEach(e => { if (e.subjectName) set.add(e.subjectName); });
    if (set.size === 0) set.add('Fisika');
    return Array.from(set).sort();
  }, [submissions, questionPackages, examPackages]);

  // Extract all unique classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.class) set.add(s.class); });
    submissions.forEach(s => { if (s.studentClass) set.add(s.studentClass); });
    return Array.from(set).sort();
  }, [students, submissions]);

  const [selectedSubject, setSelectedSubject] = useState<string>(
    (staffRole === 'guru' && currentSubject) ? currentSubject : 'ALL'
  );
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'archive' | 'table'>('archive');

  // Filter submissions (dengan auto-resolving nama dan identitas siswa dari data master siswa)
  const filteredSubmissions = useMemo(() => {
    return submissions.map(sub => {
      const studentInfo = students.find(s => s.id === sub.studentId);
      const studentName = (sub.studentName && String(sub.studentName).trim() !== '')
        ? sub.studentName
        : (studentInfo?.name || (sub.studentId ? `Siswa (${sub.studentId})` : '-'));
      const studentClass = (sub.studentClass && String(sub.studentClass).trim() !== '')
        ? sub.studentClass
        : (studentInfo?.class || '-');
      const username = (sub.username && String(sub.username).trim() !== '')
        ? sub.username
        : (studentInfo?.username || '-');
      return {
        ...sub,
        studentName,
        studentClass,
        username
      };
    }).filter(sub => {
      // Subject filter
      if (selectedSubject !== 'ALL') {
        const subMapel = (sub.subjectName || '').toLowerCase();
        const targetMapel = selectedSubject.toLowerCase();
        if (!subMapel.includes(targetMapel) && !targetMapel.includes(subMapel)) {
          return false;
        }
      }

      // Class filter
      if (selectedClass !== 'ALL') {
        if (sub.studentClass !== selectedClass) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = sub.studentName.toLowerCase().includes(q);
        const matchUser = sub.username.toLowerCase().includes(q);
        const matchClass = sub.studentClass.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchClass) return false;
      }

      return true;
    });
  }, [submissions, students, selectedSubject, selectedClass, searchTerm]);

  // Compute statistics
  const stats = useMemo(() => {
    const count = filteredSubmissions.length;
    if (count === 0) {
      return { count: 0, avg: 0, max: 0, min: 0, passed: 0, failed: 0, passRate: 0 };
    }
    const scores = filteredSubmissions.map(s => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / count);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const KKM = 75;
    const passed = scores.filter(s => s >= KKM).length;
    const failed = count - passed;
    const passRate = Math.round((passed / count) * 100);

    return { count, avg, max, min, passed, failed, passRate };
  }, [filteredSubmissions]);

  // Export filtered archive to CSV
  const exportArchiveToCSV = () => {
    if (filteredSubmissions.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += `ARSIP NILAI CBT - SMAN 1 TOILI\n`;
    csvContent += `Mata Pelajaran: ${selectedSubject === 'ALL' ? 'Semua Mata Pelajaran' : selectedSubject}\n`;
    csvContent += `Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    csvContent += 'No,Nama Siswa,Kelas,Mata Pelajaran,Username / NISN,Jawaban Benar,Jawaban Salah,Nilai Akhir,Status Ketuntasan,Waktu Pengumpulan\n';

    filteredSubmissions.forEach((s, idx) => {
      const isPassed = s.score >= 75 ? 'TUNTAS' : 'REMEDIAL';
      const mapel = s.subjectName || 'Fisika';
      const waktu = s.submittedAt ? new Date(s.submittedAt).toLocaleString('id-ID') : '-';
      csvContent += `${idx + 1},"${s.studentName}","${s.studentClass}","${mapel}","${s.username}",${s.correct},${s.wrong},${s.score},"${isPassed}","${waktu}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const mapelTag = selectedSubject !== 'ALL' ? `_${selectedSubject.replace(/\s+/g, '_')}` : '';
    const classTag = selectedClass !== 'ALL' ? `_${selectedClass.replace(/\s+/g, '_')}` : '';
    link.setAttribute('download', `Arsip_Nilai_CBT${mapelTag}${classTag}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              Arsip & Rekap Hasil Ujian per Mata Pelajaran & Kelas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola, kelompokkan, dan unduh berkas rekap nilai resmi per rombel untuk laporan kurikulum sekolah
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'archive' ? 'table' : 'archive')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {viewMode === 'archive' ? (
                <>
                  <FileText size={15} /> Lihat Tabel Detail
                </>
              ) : (
                <>
                  <Award size={15} /> Format Arsip Rombel
                </>
              )}
            </button>

            <button
              onClick={exportArchiveToCSV}
              disabled={filteredSubmissions.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Download size={15} /> Export Excel / CSV
            </button>

            <button
              onClick={() => {
                const mapelTag = selectedSubject !== 'ALL' ? `_${selectedSubject.replace(/\s+/g, '_')}` : '';
                const classTag = selectedClass !== 'ALL' ? `_${selectedClass.replace(/\s+/g, '_')}` : '';
                onDownloadPdf('archive-official-sheet', `Arsip_Nilai_CBT${mapelTag}${classTag}_SMAN1Toili.pdf`);
              }}
              disabled={isGeneratingPDF || filteredSubmissions.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Printer size={15} /> {isGeneratingPDF ? 'Memproses Cetak...' : 'Cetak Dokumen Arsip (PDF)'}
            </button>
          </div>
        </div>

        {/* Filter Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          {/* 1. Mata Pelajaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen size={13} className="text-indigo-600" />
              Mata Pelajaran:
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 2. Kelas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-indigo-600" />
              Kelas / Rombel:
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Kelas ({availableClasses.length} Kelas)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Kelas {cls}</option>
              ))}
            </select>
          </div>

          {/* 3. Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Search size={13} className="text-indigo-600" />
              Cari Nama / Username:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama siswa atau username..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Peserta</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.count}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Siswa Mengikuti</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-indigo-500 uppercase">Rata-Rata Nilai</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.avg}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Skala 0 - 100</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Nilai Tertinggi</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.max}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Skor Terbaik</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-red-500 uppercase">Nilai Terendah</p>
          <p className="text-2xl font-black text-red-600 mt-1">{stats.min}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Perlu Evaluasi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Tuntas (KKM 75)</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.passed} Siswa</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{stats.passRate}% Tuntas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold text-amber-500 uppercase">Remedial (&lt; 75)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.failed} Siswa</p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">{100 - stats.passRate}% Remedial</p>
        </div>
      </div>

      {/* Official Archive Sheet (Used for both Screen Display & Crisp Printing) */}
      <div 
        id="archive-official-sheet"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm print:p-2 print:border-none print:shadow-none"
      >
        {/* Kop Surat Resmi SMAN 1 TOILI */}
        <div className="border-b-4 border-double border-slate-800 pb-4 mb-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <GraduationCap size={32} className="text-indigo-800 print:text-black" />
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-wider text-slate-900 uppercase">
                PEMERINTAH PROVINSI SULAWESI TENGAH
              </h1>
              <h2 className="text-sm sm:text-lg font-black tracking-wide text-indigo-900 print:text-black uppercase">
                DINAS PENDIDIKAN • SMA NEGERI 1 TOILI
              </h2>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 italic">
            Jl. Trans Sulawesi, Kec. Toili, Kab. Banggai, Sulawesi Tengah • CBT System Terintegrasi
          </p>
          <div className="mt-3 pt-2 border-t border-slate-300">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-widest">
              ARSIP REKAPITULASI HASIL ASESMEN SUMATIF / UJIAN CBT
            </h3>
            <p className="text-xs font-semibold text-slate-700">TAHUN PELAJARAN 2025/2026</p>
          </div>
        </div>

        {/* Metadata Arsip Rombel & Mapel */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-5 text-xs text-slate-800 flex flex-wrap justify-between items-center gap-2 print:bg-white print:border-slate-400">
          <div>
            <span className="font-semibold text-slate-500">Mata Pelajaran: </span>
            <span className="font-black text-indigo-900 print:text-black text-sm uppercase">
              {selectedSubject === 'ALL' ? 'Semua Mata Pelajaran' : selectedSubject}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Kelas / Rombel: </span>
            <span className="font-black text-indigo-900 print:text-black text-sm uppercase">
              {selectedClass === 'ALL' ? 'Semua Kelas' : `Kelas ${selectedClass}`}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-500">KKM Minimum: </span>
            <span className="font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px]">
              75.00
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Tanggal Cetak: </span>
            <span className="font-medium text-slate-700">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Tabel Data Rekap Nilai Siswa */}
        {filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-sm text-slate-600">Belum ada data nilai pada filter yang dipilih.</p>
            <p className="text-xs text-slate-400 mt-1">Silakan sesuaikan pilihan Mata Pelajaran atau Kelas di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold uppercase text-[11px] print:bg-slate-200 print:text-black">
                  <th className="p-2.5 border border-slate-300 text-center w-10">No</th>
                  <th className="p-2.5 border border-slate-300">Nama Siswa</th>
                  <th className="p-2.5 border border-slate-300 text-center w-24">Kelas</th>
                  <th className="p-2.5 border border-slate-300 text-center w-28">Username/NISN</th>
                  <th className="p-2.5 border border-slate-300 text-center w-28">Mata Pelajaran</th>
                  <th className="p-2.5 border border-slate-300 text-center w-16">Benar</th>
                  <th className="p-2.5 border border-slate-300 text-center w-16">Salah</th>
                  <th className="p-2.5 border border-slate-300 text-center w-20">Nilai Akhir</th>
                  <th className="p-2.5 border border-slate-300 text-center w-24">Ketuntasan</th>
                  <th className="p-2.5 border border-slate-300 text-center w-20 print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubmissions.map((sub, index) => {
                  const isPassed = sub.score >= 75;
                  return (
                    <tr 
                      key={sub.id} 
                      className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="p-2.5 border border-slate-300 text-center font-bold text-slate-500 font-mono">
                        {index + 1}
                      </td>
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900">
                        {sub.studentName}
                        {sub.isForced && (
                          <span className="ml-1.5 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-extrabold print:border">
                            Dihentikan Paksa
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-semibold text-slate-700">
                        {sub.studentClass}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-mono text-slate-600">
                        {sub.username}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-medium text-slate-700">
                        {sub.subjectName || 'Fisika'}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-600 font-mono">
                        {sub.correct}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-bold text-red-500 font-mono">
                        {sub.wrong}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center font-mono font-black text-sm">
                        <span className={isPassed ? 'text-indigo-900 print:text-black' : 'text-red-600 print:text-black'}>
                          {sub.score}
                        </span>
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPassed 
                            ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black' 
                            : 'bg-red-100 text-red-800 print:bg-transparent print:text-black'
                        }`}>
                          {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                        </span>
                      </td>
                      <td className="p-2.5 border border-slate-300 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewDetail(sub)}
                            title="Lihat Lembar Jawaban"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                          </button>
                          {staffRole === 'admin' && onDeleteSubmission && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus hasil ujian ${sub.studentName}?`)) {
                                  onDeleteSubmission(sub.id);
                                }
                              }}
                              title="Hapus Submission"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Resmi Pengesahan Dokumen Arsip */}
        <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-4 text-xs text-slate-800">
          <div className="text-center space-y-1">
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala SMA Negeri 1 Toili</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">Drs. H. Mursidin, M.Pd</p>
            <p className="text-[10px] text-slate-500 font-mono">NIP. 19680512 199403 1 008</p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-slate-500">Toili, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold text-slate-900">Guru Pengampu Mata Pelajaran</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">
              {staffRole === 'guru' ? 'Guru Mata Pelajaran' : 'Tim Asesmen CBT SMAN 1 Toili'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">NIP. - / Pembina Asesmen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
