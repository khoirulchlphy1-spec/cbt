import React, { useState } from 'react';
import { 
  Users, UserCheck, ShieldCheck, BookOpen, Key, Plus, 
  Trash2, Edit, CheckCircle, AlertCircle, Eye, EyeOff, Shield
} from 'lucide-react';
import { StaffUser, StaffRole } from '../types';

interface StaffManagementViewProps {
  staffUsers: StaffUser[];
  currentStaffUser: StaffUser | null;
  onSaveStaffUser: (user: StaffUser) => void;
  onDeleteStaffUser: (id: string) => void;
  subjects?: string[];
}

export function StaffManagementView({
  staffUsers,
  currentStaffUser,
  onSaveStaffUser,
  onDeleteStaffUser,
  subjects = []
}: StaffManagementViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'guru' as StaffRole,
    subject: ''
  });
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'guru',
      subject: 'Fisika'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      subject: user.subject || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      setFormError('Semua kolom wajib diisi!');
      return;
    }

    // Check duplicate username
    const duplicate = staffUsers.find(
      u => u.username.toLowerCase() === formData.username.trim().toLowerCase() && 
      u.id !== editingUser?.id
    );
    if (duplicate) {
      setFormError(`Username "${formData.username}" sudah digunakan oleh staf lain.`);
      return;
    }

    const payload: StaffUser = {
      id: editingUser?.id || `staff-${Date.now()}`,
      name: formData.name.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(),
      role: formData.role,
      subject: formData.role === 'guru' ? (formData.subject.trim() || 'Fisika') : undefined,
      createdAt: editingUser?.createdAt || new Date().toISOString()
    };

    onSaveStaffUser(payload);
    setShowAddModal(false);
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-indigo-600" />
            Pengaturan Akun Pengguna (Guru & Pengawas)
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Kelola hak akses sistem CBT: <strong>Guru</strong> (buat & edit soal, paket ujian), <strong>Pengawas</strong> (kontrol & monitoring ujian), dan <strong>Admin</strong> (akses penuh seluruh modul).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
        >
          <Plus size={16} /> Tambah Akun Guru / Pengawas
        </button>
      </div>

      {/* Role Privileges Matrix Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Admin */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-indigo-800">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 bg-amber-400 text-indigo-950 font-black text-[11px] rounded-lg uppercase tracking-wider">
              Akses Penuh
            </span>
            <ShieldCheck size={24} className="text-amber-400" />
          </div>
          <h3 className="font-bold text-base text-white">Administrator</h3>
          <p className="text-xs text-indigo-200 mt-1">Pengendali utama sistem CBT sekolah</p>
          <ul className="mt-4 space-y-1.5 text-xs text-indigo-100/90 border-t border-indigo-800/80 pt-3">
            <li className="flex items-center gap-2">✓ Manajemen 700 Database Siswa</li>
            <li className="flex items-center gap-2">✓ Bank Soal & Paket Ujian Penuh</li>
            <li className="flex items-center gap-2">✓ Pengaturan User Guru & Pengawas</li>
            <li className="flex items-center gap-2">✓ Kontrol Token & PIN Buka Kunci</li>
            <li className="flex items-center gap-2">✓ Cetak Kartu & Arsip Nilai Sekolah</li>
          </ul>
        </div>

        {/* 2. Guru */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg uppercase tracking-wider">
              Akademik & Soal
            </span>
            <BookOpen size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-base text-slate-800">Guru Mata Pelajaran</h3>
          <p className="text-xs text-slate-500 mt-1">Pembuat & pengelola bank soal serta paket ujian</p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <li className="flex items-center gap-2 text-emerald-700 font-semibold">✓ Membuat & Mengedit Bank Soal</li>
            <li className="flex items-center gap-2 text-emerald-700 font-semibold">✓ Membuat Paket Ujian Rombel</li>
            <li className="flex items-center gap-2 text-emerald-700 font-semibold">✓ Melihat & Cetak Arsip Nilai Siswa</li>
            <li className="flex items-center gap-2 text-slate-400">✕ Tidak bisa mereset database siswa</li>
            <li className="flex items-center gap-2 text-slate-400">✕ Tidak bisa ubah pengaturan user lain</li>
          </ul>
        </div>

        {/* 3. Pengawas */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-lg uppercase tracking-wider">
              Kontrol Ruangan
            </span>
            <UserCheck size={24} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-base text-slate-800">Pengawas Ujian Ruang</h3>
          <p className="text-xs text-slate-500 mt-1">Monitoring pengerjaan siswa & bantuan teknis ruang</p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <li className="flex items-center gap-2 text-blue-700 font-semibold">✓ Pantau Kehadiran & Status Peserta</li>
            <li className="flex items-center gap-2 text-blue-700 font-semibold">✓ Buka Kunci Siswa Terkunci (Unsuspend)</li>
            <li className="flex items-center gap-2 text-blue-700 font-semibold">✓ Reset Login / Koneksi Siswa</li>
            <li className="flex items-center gap-2 text-slate-400">✕ Tidak bisa edit/buat soal ujian</li>
            <li className="flex items-center gap-2 text-slate-400">✕ Tidak bisa hapus paket ujian</li>
          </ul>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            Daftar Akun Staf Pengguna ({staffUsers.length} Pengguna)
          </h3>
          <span className="text-[11px] text-slate-500">
            Login staf menggunakan Username & Password di bawah
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="p-3.5">Nama Staf</th>
                <th className="p-3.5">Peran / Hak Akses</th>
                <th className="p-3.5">Mata Pelajaran</th>
                <th className="p-3.5">Username Login</th>
                <th className="p-3.5">Password</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staffUsers.map(user => {
                const isCurrent = user.id === currentStaffUser?.id;
                const isVisible = Boolean(showPasswords[user.id]);

                let roleBadge = (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold text-[10px]">
                    Admin (Full)
                  </span>
                );
                if (user.role === 'guru') {
                  roleBadge = (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">
                      Guru Mapel
                    </span>
                  );
                } else if (user.role === 'pengawas') {
                  roleBadge = (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold text-[10px]">
                      Pengawas Ruang
                    </span>
                  );
                }

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      {user.name}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black">
                          (Anda Saat Ini)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">{roleBadge}</td>
                    <td className="p-3.5 font-medium text-slate-600">
                      {user.role === 'guru' ? (user.subject || 'Fisika') : '-'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">
                      @{user.username}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{isVisible ? user.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(user.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Akun"
                        >
                          <Edit size={14} />
                        </button>
                        {user.id !== 'usr-admin-1' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus akun staf "${user.name}"?`)) {
                                onDeleteStaffUser(user.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {editingUser ? 'Edit Akun Staf' : 'Tambah Akun Pengguna Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur hak akses sebagai Admin, Guru Pembuat Soal, atau Pengawas Ujian
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      formData.role === 'admin'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👑 Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'guru' })}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      formData.role === 'guru'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📘 Guru
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'pengawas' })}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      formData.role === 'pengawas'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🛡️ Pengawas
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. Budi Santoso, M.Pd"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formData.role === 'guru' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran Diampu <span className="text-red-500">*</span></label>
                  {subjects && subjects.length > 0 ? (
                    <select
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-xs"
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Fisika / Matematika / Biologi"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: gurufisika"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kata sandi..."
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
