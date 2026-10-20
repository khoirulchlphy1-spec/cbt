import React, { useEffect } from 'react';
import { Printer, X, ArrowLeft } from 'lucide-react';
import { Question, Submission } from '../types';
import { FormattedContent } from './FormattedContent';

interface StudentDetailModalProps {
  viewingDetail: Submission;
  questions: Question[];
  onClose: () => void;
  onDownloadPdf: (elementId: string, filename: string) => void;
  isGeneratingPDF: boolean;
}

export function StudentDetailModal({
  viewingDetail,
  questions,
  onClose,
  onDownloadPdf,
  isGeneratingPDF
}: StudentDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 z-[9999] overflow-y-auto p-3 sm:p-6 flex items-center justify-center print:static print:bg-white print:p-0 print:z-auto pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div id="student-detail-content" className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-6 border border-slate-100 max-h-[90vh] flex flex-col my-auto relative pointer-events-auto print:max-w-none print:w-full print:shadow-none print:border-none print:p-0 print:max-h-none print:overflow-visible">
        
        {/* Header khusus cetak PDF */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase tracking-wide text-black">LAPORAN HASIL UJIAN SISWA (CBT FISIKA X)</h1>
          <p className="text-xs text-slate-600 mt-1">SMA / MA — Evaluasi Berbasis Komputer & ANBK</p>
        </div>

        <div className="flex justify-between items-center pb-4 border-b mb-4 print:border-slate-300 relative z-20">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Detail Hasil Ujian - {viewingDetail.studentName}</h3>
            <p className="text-xs text-slate-500">Kelas: {viewingDetail.studentClass} • Mapel: {viewingDetail.subjectName || 'Fisika'} • Username: @{viewingDetail.username || 'siswa'}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden relative z-30">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPdf('student-detail-content', `Hasil_Ujian_${viewingDetail.studentName.replace(/\s+/g, '_')}.pdf`);
              }} 
              disabled={isGeneratingPDF}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Printer size={15} /> {isGeneratingPDF ? 'Mengunduh...' : 'Cetak PDF'}
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              title="Tutup / Kembali ke Dashboard"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <X size={16} /> <span className="hidden sm:inline font-bold">Tutup</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Nilai Siswa */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:bg-white print:border-slate-400">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Siswa</span>
            <span className="font-bold text-slate-900">{viewingDetail.studentName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Kelas</span>
            <span className="font-bold text-slate-900">{viewingDetail.studentClass}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Jawaban Benar / Salah</span>
            <span className="font-bold text-emerald-600">{viewingDetail.correct} Benar</span> / <span className="font-bold text-red-500">{viewingDetail.wrong} Salah</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Nilai Akhir</span>
            <span className="font-black text-indigo-600 text-base">{viewingDetail.score} / 100</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 print:overflow-visible">
          {questions.map((q, idx) => {
            const studentAns = viewingDetail.answers ? viewingDetail.answers[idx] : undefined;
            const isCorrect = studentAns === q.answer;

            return (
              <div key={q.id || idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'} print:bg-white print:border-slate-300 break-inside-avoid`}>
                <p className="font-bold text-xs text-slate-600 mb-1">Soal #{idx + 1}:</p>
                <FormattedContent text={q.text} qId={q.id} fontSizeClass="text-sm font-medium" />

                <div className="text-xs space-y-1 mt-3">
                  <p className={isCorrect ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                    Jawaban Siswa: {studentAns !== undefined ? `${String.fromCharCode(65 + studentAns)}. ${q.options[studentAns]}` : 'Tidak dijawab'} {isCorrect ? '(BENAR ✓)' : '(SALAH ✗)'}
                  </p>
                  {!isCorrect && (
                    <p className="text-emerald-700 font-bold">
                      Kunci Jawaban: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t mt-4 flex justify-between items-center print:hidden relative z-20">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadPdf('student-detail-content', `Hasil_Ujian_${viewingDetail.studentName.replace(/\s+/g, '_')}.pdf`);
            }}
            disabled={isGeneratingPDF}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Printer size={16} /> {isGeneratingPDF ? 'Memproses PDF...' : 'Unduh Hasil (PDF)'}
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <ArrowLeft size={16} /> Tutup / Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
