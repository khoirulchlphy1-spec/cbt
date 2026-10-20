import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, X, Check, Search, Tag, AlertCircle } from 'lucide-react';

interface SubjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  onAddSubject: (subjectName: string) => void;
  onDeleteSubject: (subjectName: string) => void;
}

export function SubjectManagementModal({
  isOpen,
  onClose,
  subjects,
  onAddSubject,
  onDeleteSubject
}: SubjectManagementModalProps) {
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = newSubject.trim();
    if (!trimmed) {
      setError('Nama mata pelajaran tidak boleh kosong.');
      return;
    }

    if (subjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Mata pelajaran "${trimmed}" sudah ada di dalam daftar.`);
      return;
    }

    onAddSubject(trimmed);
    setNewSubject('');
  };

  const filteredSubjects = subjects.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Master Data Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-500">
                Kelola daftar mata pelajaran untuk paket soal, ujian, dan arsip
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Form Tambah Mapel */}
        <form onSubmit={handleAdd} className="my-4 flex-shrink-0">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Tambah Mata Pelajaran Baru
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Contoh: Sosiologi, Antropologi, Seni Rupa..."
              value={newSubject}
              onChange={e => {
                setNewSubject(e.target.value);
                if (error) setError('');
              }}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={16} /> Tambah Mapel
            </button>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Search & List */}
        <div className="flex-1 overflow-hidden flex flex-col pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-600" />
              Daftar Mata Pelajaran Aktif ({subjects.length})
            </span>

            <div className="relative w-44">
              <input 
                type="text"
                placeholder="Cari mapel..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search size={13} className="absolute left-2 top-2 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {filteredSubjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada mata pelajaran yang cocok dengan pencarian.
              </div>
            ) : (
              filteredSubjects.map((sub, idx) => (
                <div 
                  key={sub}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{sub}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus mata pelajaran "${sub}" dari daftar master data?`)) {
                        onDeleteSubject(sub);
                      }
                    }}
                    title={`Hapus ${sub}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center flex-shrink-0 mt-3">
          <span className="text-[11px] text-slate-400">
            Mata pelajaran di atas akan muncul otomatis pada pembuatan paket soal & paket ujian.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
