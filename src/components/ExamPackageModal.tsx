import React, { useState, useEffect } from 'react';
import { X, Check, Key, Clock, Layers, Users, UserCheck, Search, Filter } from 'lucide-react';
import { ExamPackage, QuestionPackage, Student } from '../types';

interface ExamPackageModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (examData: ExamPackage) => void;
  editingExam?: ExamPackage | null;
  exam?: ExamPackage | null; // Support alias
  questionPackages: QuestionPackage[];
  students?: Student[];
}

export const ExamPackageModal: React.FC<ExamPackageModalProps> = ({
  isOpen = true,
  onClose,
  onSave,
  editingExam,
  exam,
  questionPackages,
  students = []
}) => {
  const activeExam = editingExam || exam;

  const [title, setTitle] = useState('');
  const [questionPackageId, setQuestionPackageId] = useState('');
  const [targetMode, setTargetMode] = useState<'class' | 'students'>('class');
  const [targetClass, setTargetClass] = useState('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [token, setToken] = useState('ANBK2026');
  const [durationMinutes, setDurationMinutes] = useState(70);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Extract unique classes from student list + defaults
  const defaultClassList = ['X MIPA 1', 'X MIPA 2', 'XI IPA 1', 'XI IPA 2', 'XII IPA 1', 'XII IPA 2'];
  const availableClasses = Array.from(
    new Set([...students.map(s => s.class).filter(Boolean), ...defaultClassList])
  );

  // Helper to parse targetClass into array
  const currentSelectedClasses = targetClass
    ? targetClass.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const isAllClasses = targetClass.trim().toUpperCase() === 'ALL' || 
                       targetClass.trim().toUpperCase() === 'SEMUA' || 
                       currentSelectedClasses.includes('ALL');

  const handleToggleClassSelect = (c: string) => {
    if (c === 'ALL') {
      setTargetClass('ALL');
      return;
    }

    let updated: string[] = [];
    if (isAllClasses) {
      // If was ALL, switch to only this class
      updated = [c];
    } else if (currentSelectedClasses.includes(c)) {
      // Uncheck this class
      updated = currentSelectedClasses.filter(cls => cls !== c);
      if (updated.length === 0) {
        setTargetClass('ALL');
        return;
      }
    } else {
      // Add this class
      updated = [...currentSelectedClasses.filter(cls => cls !== 'ALL'), c];
    }

    setTargetClass(updated.join(', '));
  };

  useEffect(() => {
    if (activeExam) {
      setTitle(activeExam.title || '');
      setQuestionPackageId(activeExam.questionPackageId || (questionPackages[0]?.id || ''));
      setTargetClass(activeExam.targetClass || 'ALL');
      if (activeExam.selectedStudentIds && activeExam.selectedStudentIds.length > 0) {
        setTargetMode('students');
        setSelectedStudentIds(activeExam.selectedStudentIds);
      } else {
        setTargetMode('class');
        setSelectedStudentIds([]);
      }
      setToken(activeExam.token || 'ANBK2026');
      setDurationMinutes(activeExam.durationMinutes || 70);
      setIsActive(typeof activeExam.isActive === 'boolean' ? activeExam.isActive : true);
    } else {
      setTitle('');
      setQuestionPackageId(questionPackages[0]?.id || '');
      setTargetMode('class');
      setTargetClass('ALL');
      setSelectedStudentIds([]);
      setToken(`CBT${Math.floor(1000 + Math.random() * 9000)}`);
      setDurationMinutes(70);
      setIsActive(true);
    }
    setError('');
  }, [activeExam?.id, isOpen]);

  if (isOpen === false) return null;

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.class.toLowerCase().includes(studentSearch.toLowerCase());
    return matchSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama paket ujian tidak boleh kosong.');
      return;
    }
    if (!questionPackageId) {
      setError('Pilih salah satu paket soal dari Bank Soal.');
      return;
    }
    if (targetMode === 'students' && selectedStudentIds.length === 0) {
      setError('Pilih minimal 1 siswa jika menggunakan mode Siswa Spesifik.');
      return;
    }
    if (!token.trim()) {
      setError('Token ujian tidak boleh kosong.');
      return;
    }

    const selectedPkg = questionPackages.find(p => p.id === questionPackageId);

    // Compute display target class text
    let targetClassDisplay = targetClass.trim() || 'ALL';
    if (targetMode === 'students') {
      targetClassDisplay = `${selectedStudentIds.length} Siswa Terpilih`;
    }

    onSave({
      id: activeExam?.id || `exam-${Date.now()}`,
      title: title.trim(),
      questionPackageId: questionPackageId,
      targetClass: targetClassDisplay,
      selectedStudentIds: targetMode === 'students' ? selectedStudentIds : [],
      token: token.trim().toUpperCase(),
      durationMinutes: Number(durationMinutes) || 60,
      isActive: isActive,
      subjectName: selectedPkg?.subject || 'Umum',
      createdAt: activeExam?.createdAt || new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {activeExam ? 'Edit Paket Ujian' : 'Buat Paket Ujian Baru'}
              </h3>
              <p className="text-xs text-slate-500">Kelola nama paket, bank soal, target siswa/kelas & durasi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-200 flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 my-3 flex-1">
          {/* 1. Nama Paket Ujian */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Paket Ujian <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: SIMULASI CBT ANBK 2026 - FISIKA & TIU"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 2. Pilih Soal dari Paket Soal (Bank Soal) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pilih Paket Soal (Dari Bank Soal) <span className="text-red-500">*</span>
            </label>
            <select
              value={questionPackageId}
              onChange={e => setQuestionPackageId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {questionPackages.length === 0 ? (
                <option value="">(Belum ada paket soal. Buat di tab Bank Soal dulu)</option>
              ) : (
                questionPackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    [{pkg.subject}] {pkg.title} ({pkg.questions?.length || 0} Soal - Kelas Target: {pkg.targetClass})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Target Peserta: Pilihan Langsung Kelas OR Siswa Spesifik */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Target Peserta Ujian <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTargetMode('class')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetMode === 'class'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users size={16} /> Pilih Berdasarkan Kelas
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('students')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  targetMode === 'students'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck size={16} /> Pilih Siswa Spesifik ({selectedStudentIds.length})
              </button>
            </div>

            {/* Mode Class Selector */}
            {targetMode === 'class' ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700">
                      Pilih Kelas Target (Bisa memilih lebih dari 1 kelas):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleClassSelect('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                        isAllClasses
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isAllClasses ? '✓ SEMUA KELAS (ALL)' : 'Pilih Semua Kelas'}
                    </button>
                  </div>

                  {/* Multi-class Buttons Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2">
                    {availableClasses.map(c => {
                      const isSelected = !isAllClasses && currentSelectedClasses.map(s => s.toUpperCase()).includes(c.toUpperCase());
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleToggleClassSelect(c)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : isAllClasses
                              ? 'bg-amber-50 text-amber-900 border-amber-200 opacity-80'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black ${
                            isSelected
                              ? 'bg-white text-amber-600'
                              : isAllClasses
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isSelected || isAllClasses ? '✓' : '+'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Text box for manual editing or custom class names */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Daftar Kelas Terpilih (Pisahkan dengan koma jika ketik manual):
                  </label>
                  <input 
                    type="text"
                    placeholder="Contoh: X MIPA 1, X MIPA 2, XI IPA 1"
                    value={targetClass}
                    onChange={e => setTargetClass(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 <span className="font-semibold text-slate-600">Tips:</span> Siswa di setiap kelas yang tercantum di atas dapat login & mengerjakan paket ujian ini secara bersamaan.
                  </p>
                </div>
              </div>
            ) : (
              /* Mode Specific Students Picker */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Cari nama, username, atau kelas..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllFilteredStudents}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer"
                  >
                    Pilih/Batal Semua
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">Siswa tidak ditemukan.</p>
                  ) : (
                    filteredStudents.map(student => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <label
                          key={student.id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors pt-2 ${
                            isSelected ? 'bg-amber-100/60 border border-amber-300 font-bold' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(student.id)}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-slate-800 block leading-tight">{student.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">@{student.username}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                            {student.class}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="text-[11px] font-bold text-amber-800 text-right pt-1">
                  Total Siswa Terpilih: {selectedStudentIds.length} Siswa
                </div>
              </div>
            )}
          </div>

          {/* 4. Durasi Ujian & Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Durasi Ujian (Menit) <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-1.5">
                <input 
                  type="number"
                  required
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Clock size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[45, 60, 70, 90, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDurationMinutes(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      durationMinutes === m
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Token Masuk Ujian <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  placeholder="CBT2026"
                  value={token}
                  onChange={e => setToken(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                />
                <Key size={16} className="absolute left-3 top-2.5 text-amber-500" />
              </div>
            </div>
          </div>

          {/* Status Aktif */}
          <div>
            <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                {isActive ? '🟢 Status: Aktif / Buka Sesi Ujian (Siswa dapat masuk)' : '🔴 Status: Nonaktif (Ditutup)'}
              </span>
            </label>
          </div>

          <div className="pt-3 flex gap-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} /> Simpan Paket Ujian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
