import React from 'react';
import { FileSpreadsheet, X, FileUp, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Student } from '../types';
import { downloadStudentTemplate } from '../utils/studentTemplate';

interface ImportModalProps {
  onClose: () => void;
  importError: string;
  importSuccessMsg: string;
  importText: string;
  importPreviewData: Student[];
  onFileUploadImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportTextChange: (val: string) => void;
  onProcessImport: (e: React.FormEvent) => void;
}

export function ImportModal({
  onClose,
  importError,
  importSuccessMsg,
  importText,
  importPreviewData,
  onFileUploadImport,
  onImportTextChange,
  onProcessImport
}: ImportModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b mb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <FileSpreadsheet size={20} className="mr-2 text-emerald-600"/> Import Data Siswa (Excel / CSV)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-emerald-700" /> Format & Template Data Siswa
              </span>
              <button
                type="button"
                onClick={downloadStudentTemplate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer text-[11px]"
              >
                <Download size={13} /> Download Template Excel/CSV
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              1. Silakan unduh format template di atas, isi data nama siswa, kelas, username, dan password di Excel/Google Sheets, lalu upload file CSV-nya.
            </p>
            <p className="text-slate-600 leading-relaxed">
              2. Atau <strong>Copy & Paste langsung</strong> baris data dari Excel pada kolom teks di bawah:
              <br />
              <code className="bg-emerald-100 text-emerald-900 font-mono px-2 py-0.5 rounded text-[11px] font-bold mt-1 inline-block">
                Nama Lengkap | Kelas | Username | Password
              </code>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="flex-1 w-full cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center transition-colors">
              <FileUp size={24} className="mx-auto mb-1 text-slate-600" />
              <span className="block text-xs font-bold text-slate-800">Upload File CSV Hasil Isi Template</span>
              <span className="block text-[10px] text-slate-500">Pilih file .csv dari laptop / komputer</span>
              <input 
                type="file" 
                accept=".csv, .txt" 
                onChange={onFileUploadImport}
                className="hidden" 
              />
            </label>
          </div>

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0"/> {importError}
            </div>
          )}

          {importSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center">
              <CheckCircle size={16} className="mr-2" /> {importSuccessMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Atau Tempel / Paste Teks Data Siswa Di Sini</label>
            <textarea 
              rows={5}
              className="w-full p-3.5 border rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              placeholder={`Contoh teks salinan dari Excel:\nAhmad Rizky Pratama\tX MIPA 1\tsiswa101\t123\nSiti Nurhaliza\tX MIPA 1\tsiswa102\t123`}
              value={importText}
              onChange={e => onImportTextChange(e.target.value)}
            />
          </div>

          {importPreviewData.length > 0 && (
            <div className="border rounded-2xl p-3 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-700 mb-2">Pratinjau Data Siswa ({importPreviewData.length} Siswa Terdeteksi):</p>
              <div className="max-h-36 overflow-y-auto border rounded-xl bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-600">
                    <tr>
                      <th className="p-2 border-b">No</th>
                      <th className="p-2 border-b">Nama Lengkap</th>
                      <th className="p-2 border-b">Kelas</th>
                      <th className="p-2 border-b">Username</th>
                      <th className="p-2 border-b">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {importPreviewData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-2">{item.class}</td>
                        <td className="p-2 font-mono text-indigo-600">@{item.username}</td>
                        <td className="p-2 font-mono">{item.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex gap-3 mt-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onProcessImport}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 cursor-pointer transition-colors"
          >
            Simpan & Masukkan ke Database ({importPreviewData.length || 'Semua'})
          </button>
        </div>
      </div>
    </div>
  );
}
