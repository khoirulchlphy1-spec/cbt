import React from 'react';
import { Edit, X } from 'lucide-react';
import { Student } from '../types';

interface EditStudentModalProps {
  editingStudent: Student;
  editStudentError: string;
  setEditingStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  onClose: () => void;
  onSaveStudentEdit: (e: React.FormEvent) => void;
}

export function EditStudentModal({
  editingStudent,
  editStudentError,
  setEditingStudent,
  onClose,
  onSaveStudentEdit
}: EditStudentModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex justify-between items-center pb-4 border-b mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Edit size={20} className="mr-2 text-indigo-600"/> Edit Data Akun Siswa
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {editStudentError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-3">
            {editStudentError}
          </div>
        )}

        <form onSubmit={onSaveStudentEdit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={editingStudent.name}
              onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={editingStudent.class}
              onChange={e => setEditingStudent({ ...editingStudent, class: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              value={editingStudent.username}
              onChange={e => setEditingStudent({ ...editingStudent, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
              value={editingStudent.password}
              onChange={e => setEditingStudent({ ...editingStudent, password: e.target.value })}
            />
          </div>

          <div className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center my-2">
            <span className="text-xs font-bold text-slate-700">Akses Izin Ujian:</span>
            <button 
              type="button"
              onClick={() => setEditingStudent({ ...editingStudent, examAllowed: !editingStudent.examAllowed })}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${editingStudent.examAllowed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
            >
              {editingStudent.examAllowed ? 'Diizinkan' : 'Diblokir'}
            </button>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
