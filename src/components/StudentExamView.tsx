import React from 'react';
import { Clock, LayoutDashboard, Type, CheckCircle, ChevronLeft, ChevronRight, Send, Bookmark, AlertTriangle } from 'lucide-react';
import { Question } from '../types';
import { FormattedContent } from './FormattedContent';

interface StudentExamViewProps {
  loggedStudent: any;
  questions: Question[];
  currentQuestionIdx: number;
  setCurrentQuestionIdx: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<number, number>;
  handleAnswerSelect: (qIdx: number, optionIdx: number) => void;
  doubtfulAnswers: Record<number, boolean>;
  toggleDoubtful: (qIdx: number) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: React.Dispatch<React.SetStateAction<'normal' | 'large' | 'xlarge'>>;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  violationWarning: string | null;
  setViolationWarning: React.Dispatch<React.SetStateAction<string | null>>;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  mobileNavOpen: boolean;
  setMobileNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExamActiveGlobal?: boolean;
}

export function StudentExamView({
  loggedStudent,
  questions,
  currentQuestionIdx,
  setCurrentQuestionIdx,
  answers,
  handleAnswerSelect,
  doubtfulAnswers,
  toggleDoubtful,
  fontSize,
  setFontSize,
  timeLeft,
  formatTime,
  violationWarning,
  setViolationWarning,
  setShowConfirmModal,
  mobileNavOpen,
  setMobileNavOpen,
  isExamActiveGlobal = true
}: StudentExamViewProps) {
  const q = questions[currentQuestionIdx];
  const isAnswered = (idx: number) => answers[idx] !== undefined;

  const textClass = fontSize === 'large' ? 'text-lg sm:text-xl' : fontSize === 'xlarge' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-lg';
  const optionTextClass = fontSize === 'large' ? 'text-base sm:text-lg' : fontSize === 'xlarge' ? 'text-lg sm:text-xl' : 'text-xs sm:text-base';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none pb-20 sm:pb-12 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        input[type="text"], input[type="search"], textarea, [contenteditable="true"] {
          -webkit-user-select: none !important;
          user-select: none !important;
        }
        button, label, input[type="radio"], input[type="checkbox"] {
          touch-action: manipulation !important;
          cursor: pointer !important;
        }
        @media print {
          body { display: none !important; }
        }
      `}} />

      {/* Global Exam Paused Overlay */}
      {!isExamActiveGlobal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[999999] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/30 animate-pulse">
            <Clock size={36} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase">UJIAN DIPAUSE SEMENTARA OLEH ADMIN</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md mb-4 leading-relaxed">
            Admin sedang menghentikan sementara sesi ujian. Jawaban Anda tersimpan aman secara real-time. Harap tunggu sampai Admin mengaktifkan kembali ujian.
          </p>
          <div className="inline-flex items-center gap-2 bg-slate-800 text-amber-300 px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Menunggu Aba-Aba Admin...
          </div>
        </div>
      )}

      {/* Watermark Identitas Siswa Melayang untuk Mencegah Foto Kamera Luar & Screenshot */}
      <div className="fixed inset-0 pointer-events-none z-10 flex flex-wrap items-center justify-around opacity-[0.06] overflow-hidden select-none">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="p-8 transform -rotate-12 text-slate-900 font-black text-xs sm:text-sm tracking-widest uppercase whitespace-nowrap">
            {loggedStudent?.name} • {loggedStudent?.class} • @{loggedStudent?.username} • CBT SMAN 1 TOILI
          </div>
        ))}
      </div>

      {violationWarning && (
        <div className="bg-red-600 text-white px-4 sm:px-6 py-2.5 shadow-lg flex items-center justify-between z-50 animate-bounce">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{violationWarning}</span>
          </div>
          <button 
            onClick={() => setViolationWarning(null)} 
            className="text-red-100 hover:text-white font-bold text-[11px] sm:text-xs bg-red-800/80 px-2.5 py-1 rounded-lg flex-shrink-0 ml-2 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="bg-indigo-900 text-white shadow-md px-3 sm:px-8 py-2.5 sm:py-3 sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm border border-indigo-400 flex-shrink-0">
              {loggedStudent?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xs sm:text-base text-white leading-tight truncate max-w-[170px] sm:max-w-xs">{loggedStudent?.name}</h2>
              <p className="text-[10px] sm:text-xs text-indigo-200 truncate">{loggedStudent?.class} • SMAN 1 TOILI</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <div className={`flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-950 text-emerald-400 border border-indigo-800'}`}>
              <Clock size={13} />
              {formatTime(timeLeft)}
            </div>

            <button 
              onClick={() => setMobileNavOpen(true)}
              className="bg-indigo-800 active:bg-indigo-700 text-indigo-100 p-1.5 rounded-lg border border-indigo-600 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <LayoutDashboard size={15} />
              <span className="text-[10px] font-bold bg-indigo-600 px-1.5 py-0.5 rounded-md text-white">
                {currentQuestionIdx + 1}/{questions.length}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-indigo-800/80 pt-2 sm:pt-0">
          <div className="flex items-center bg-indigo-950 p-1 rounded-lg border border-indigo-800">
            <span className="text-[10px] text-indigo-300 px-1.5 font-semibold flex items-center gap-0.5">
              <Type size={11}/> Teks:
            </span>
            <button 
              onClick={() => setFontSize('normal')} 
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${fontSize === 'normal' ? 'bg-indigo-600 text-white' : 'text-indigo-300'}`}
            >
              A
            </button>
            <button 
              onClick={() => setFontSize('large')} 
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${fontSize === 'large' ? 'bg-indigo-600 text-white' : 'text-indigo-300'}`}
            >
              A+
            </button>
            <button 
              onClick={() => setFontSize('xlarge')} 
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${fontSize === 'xlarge' ? 'bg-indigo-600 text-white' : 'text-indigo-300'}`}
            >
              A++
            </button>
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 font-mono text-base md:text-lg font-bold px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-indigo-950 text-emerald-400 border border-indigo-800'}`}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>

          <button 
            onClick={() => setShowConfirmModal(true)}
            className="bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle size={15} /> Selesai
          </button>
        </div>
      </header>

      {/* Main Exam Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
        <div className="flex-1 w-full bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col min-h-[480px]">
          {/* Header Nomor Soal */}
          <div className="bg-slate-50 px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b flex justify-between items-center">
            <span className="font-extrabold text-sm sm:text-lg text-slate-800">
              Soal Nomor <span className="text-indigo-600">{currentQuestionIdx + 1}</span> <span className="text-slate-400 text-xs font-normal">/ {questions.length}</span>
            </span>
            <span className="text-[10px] sm:text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">
              Pilihan Ganda
            </span>
          </div>
          
          {q ? (
            <div id="cbt-question-scroll-area" data-cbt-scroll="true" className="p-3.5 sm:p-8 flex-1 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-170px)] sm:max-h-[none] touch-pan-y">
              <div>
                <FormattedContent text={q.text} qId={q.id} fontSizeClass={textClass} />
                
                {/* Opsi Jawaban */}
                <div className="space-y-2.5 sm:space-y-3 mt-4 sm:mt-6">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestionIdx] === optIdx;
                    return (
                      <label 
                        key={optIdx} 
                        onClick={() => handleAnswerSelect(currentQuestionIdx, optIdx)}
                        className={`flex items-start p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] touch-manipulation ${
                          isSelected ? 'border-indigo-600 bg-indigo-50/90 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                        }`}
                      >
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm mr-2.5 sm:mr-3 flex-shrink-0 transition-colors mt-0.5 ${
                          isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className={`${optionTextClass} text-slate-800 font-medium leading-relaxed flex-1 select-none`}>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Ragu-Ragu Checkbox */}
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 cursor-pointer bg-amber-50 active:bg-amber-100 hover:bg-amber-100/80 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
                    checked={!!doubtfulAnswers[currentQuestionIdx]}
                    onChange={() => toggleDoubtful(currentQuestionIdx)}
                  />
                  <Bookmark size={15} className={doubtfulAnswers[currentQuestionIdx] ? 'fill-amber-500 text-amber-600' : 'text-amber-700'} />
                  <span className="text-[11px] sm:text-xs">Ragu-Ragu (ANBK)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Belum ada soal ujian.</div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t flex justify-between gap-2">
            <button 
              disabled={currentQuestionIdx === 0}
              onClick={() => {
                setCurrentQuestionIdx(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ChevronLeft size={16} className="mr-0.5 sm:mr-1" /> Sebelumnya
            </button>
            
            {currentQuestionIdx < questions.length - 1 ? (
              <button 
                onClick={() => {
                  setCurrentQuestionIdx(prev => prev + 1);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center shadow-xs text-xs sm:text-sm transition-all cursor-pointer"
              >
                Selanjutnya <ChevronRight size={16} className="ml-0.5 sm:ml-1" />
              </button>
            ) : (
              <button 
                onClick={() => setShowConfirmModal(true)}
                className="flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center shadow-xs text-xs sm:text-sm transition-all cursor-pointer"
              >
                <Send size={15} className="mr-1.5" /> Kirim
              </button>
            )}
          </div>
        </div>

        {/* Desktop Right Sidebar Question Nav */}
        <div className="hidden md:block w-80 bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sticky top-20">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center text-sm">
            <LayoutDashboard size={18} className="mr-2 text-indigo-600"/> Navigasi Soal Fisika
          </h3>

          <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((_, idx) => {
              const answered = isAnswered(idx);
              const isDoubtful = doubtfulAnswers[idx];
              const isCurrent = currentQuestionIdx === idx;
              
              let btnClass = "w-full aspect-square rounded-lg font-bold text-xs border flex items-center justify-center transition-all relative cursor-pointer ";
              
              if (isCurrent) btnClass += "ring-2 ring-indigo-600 ring-offset-2 ";

              if (isDoubtful) {
                btnClass += "bg-amber-400 text-slate-900 border-amber-500 font-extrabold";
              } else if (answered) {
                btnClass += "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700";
              } else {
                btnClass += "bg-white text-slate-600 border-slate-300 hover:bg-slate-100";
              }

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentQuestionIdx(idx);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className={btnClass}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setShowConfirmModal(true)}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center shadow-xs text-xs cursor-pointer"
          >
            <Send size={16} className="mr-2" /> Kumpulkan Ujian Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
