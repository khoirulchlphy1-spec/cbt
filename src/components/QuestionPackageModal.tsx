import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Check } from 'lucide-react';
import { QuestionPackage } from '../types';

interface QuestionPackageModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave: (pkgData: Omit<QuestionPackage, 'questions'>) => void;
  editingPackage?: QuestionPackage | null;
  pkg?: QuestionPackage | null;
  subjects?: string[];
}

export const QuestionPackageModal: React.FC<QuestionPackageModalProps> = ({
  isOpen = true,
  onClose,
  onSave,
  editingPackage,
  pkg,
  subjects = []
}) => {
  const activePkg = editingPackage || pkg;
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetClass, setTargetClass] = useState('ALL');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activePkg) {
      setTitle(activePkg.title || '');
      setSubject(activePkg.subject || '');
      setTargetClass(activePkg.targetClass || 'ALL');
      setDescription(activePkg.description || '');
    } else {
      setTitle('');
      setSubject('');
      setTargetClass('ALL');
      setDescription('');
    }
    setError('');
  }, [activePkg?.id, isOpen]);

  if (isOpen === false) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama paket soal tidak boleh kosong.');
      return;
    }
    if (!subject.trim()) {
      setError('Mata pelajaran tidak boleh kosong.');
      return;
    }

    onSave({
      id: editingPackage?.id || `pkg-${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      targetClass: targetClass.trim() || 'ALL',
      description: description.trim(),
      createdAt: editingPackage?.createdAt || new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {editingPackage ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
              </h3>
              <p className="text-xs text-slate-500">Kelola kelompok soal berdasarkan mata pelajaran & kelas</p>
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
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama Paket Soal <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="Contoh: Paket Soal Tes Intelegensi Umum (TIU)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              {subjects && subjects.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={subjects.includes(subject) ? subject : (subject ? '__custom__' : '')}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setSubject('');
                      } else {
                        setSubject(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__custom__">➕ Lainnya (Ketik Manual)...</option>
                  </select>

                  {(!subjects.includes(subject) || subject === '') && (
                    <input 
                      type="text"
                      required
                      placeholder="Ketik nama mata pelajaran..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ) : (
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Fisika, Matematika, TIU"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Kelas
              </label>
              <input 
                type="text"
                placeholder="Contoh: X MIPA, XI IPA, ALL"
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Keterangan / Deskripsi Paket
            </label>
            <textarea 
              rows={3}
              placeholder="Contoh: Paket soal untuk latihan simulasi ANBK dan OSN tingkat sekolah"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} /> Simpan Paket Soal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
