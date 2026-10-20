import React, { useState, useEffect } from 'react';
import { 
  Printer, X, GraduationCap, Filter, Download, Search, 
  CheckSquare, Square, Scissors, ShieldCheck, UserCheck, 
  LayoutGrid, AlertCircle, FileText
} from 'lucide-react';
import { Student } from '../types';

interface StudentCardModalProps {
  students: Student[];
  onClose: () => void;
  onDownloadPdf: (elementId: string, filename: string) => void;
  isGeneratingPDF: boolean;
}

// Tut Wuri Handayani / Lambang Pendidikan SVG Icon
function TutWuriHandayaniLogo({ size = 36 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer shield */}
      <polygon 
        points="50,4 94,22 94,62 50,96 6,62 6,22" 
        fill="#1e3a8a" 
        stroke="#f59e0b" 
        strokeWidth="3.5" 
      />
      {/* Inner pentagon */}
      <polygon 
        points="50,14 84,28 84,58 50,86 16,58 16,28" 
        fill="#ffffff" 
        stroke="#1e3a8a" 
        strokeWidth="2" 
      />
      {/* Torch / Flame (Belajar/Ilmu) */}
      <path 
        d="M50 22 C46 30 42 34 42 42 C42 48 46 52 50 52 C54 52 58 48 58 42 C58 34 54 30 50 22 Z" 
        fill="#dc2626" 
      />
      <path 
        d="M50 28 C48 32 46 35 46 40 C46 44 48 47 50 47 C52 47 54 44 54 40 C54 35 52 32 50 28 Z" 
        fill="#f59e0b" 
      />
      {/* Wings / Sayap (Pendidikan) */}
      <path 
        d="M32 44 C24 40 22 48 26 56 C30 62 38 62 42 58" 
        stroke="#1e3a8a" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      <path 
        d="M68 44 C76 40 78 48 74 56 C70 62 62 62 58 58" 
        stroke="#1e3a8a" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Open Book (Buku Terbuka) */}
      <path 
        d="M26 68 C38 63 46 65 50 71 C54 65 62 63 74 68 L74 74 C62 69 54 71 50 77 C46 71 38 69 26 74 Z" 
        fill="#1e3a8a" 
      />
      <circle cx="50" cy="80" r="2.5" fill="#f59e0b" />
    </svg>
  );
}

// CBT Emblem Logo
function CbtOfficialBadge({ size = 36 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <circle cx="50" cy="50" r="46" fill="#1e3a8a" stroke="#d97706" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.5" />
      {/* Graduation Cap */}
      <polygon points="50,22 80,34 50,46 20,34" fill="#1e3a8a" />
      <polygon points="50,46 72,37 72,50 50,58 28,50 28,37" fill="#2563eb" />
      <line x1="72" y1="37" x2="78" y2="48" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="49" r="2" fill="#d97706" />
      {/* Text CBT */}
      <text x="50" y="74" textAnchor="middle" fill="#1e3a8a" fontSize="16" fontWeight="900" fontFamily="sans-serif">CBT</text>
      <text x="50" y="84" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="sans-serif">ONLINE</text>
    </svg>
  );
}

// Barcode Generator SVG for authentic exam card look
function BarcodeSvg({ value }: { value: string }) {
  // Deterministic pseudo pattern from value
  const pattern = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 1, 2, 3, 1];
  return (
    <div className="flex flex-col items-center">
      <svg width="105" height="24" viewBox="0 0 105 24" className="overflow-visible">
        {pattern.map((w, idx) => {
          let x = 3;
          for (let i = 0; i < idx; i++) {
            x += pattern[i] + 1.8;
          }
          return (
            <rect 
              key={idx} 
              x={x} 
              y={2} 
              width={w} 
              height={20} 
              fill="#0f172a" 
            />
          );
        })}
      </svg>
      <span className="text-[7.5px] font-mono tracking-widest text-slate-700 font-bold -mt-0.5">
        *{value.toUpperCase()}*
      </span>
    </div>
  );
}

export function StudentCardModal({ students, onClose, onDownloadPdf, isGeneratingPDF }: StudentCardModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cardsPerPage, setCardsPerPage] = useState<number>(6); // 6 or 4
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const uniqueClasses = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort();

  // Filter students based on class and search query
  const filtered = students.filter(s => {
    if (selectedClass !== 'ALL' && s.class !== selectedClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name.toLowerCase().includes(q);
      const matchUser = s.username.toLowerCase().includes(q);
      const matchClass = s.class.toLowerCase().includes(q);
      if (!matchName && !matchUser && !matchClass) return false;
    }
    return true;
  });

  // Keep selected ids synced with filtered list if selectAll is true
  useEffect(() => {
    if (selectAll) {
      setSelectedStudentIds(filtered.map(s => s.id));
    }
  }, [selectedClass, searchQuery, selectAll, students]);

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id);
        if (next.length !== filtered.length) setSelectAll(false);
        return next;
      } else {
        const next = [...prev, id];
        if (next.length === filtered.length) setSelectAll(true);
        return next;
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelectedStudentIds([]);
    } else {
      setSelectAll(true);
      setSelectedStudentIds(filtered.map(s => s.id));
    }
  };

  // The actual students to print/display
  const studentsToRender = filtered.filter(s => selectedStudentIds.includes(s.id));

  // Chunk students into pages (sheets of A4)
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  const pages = chunkArray(studentsToRender, cardsPerPage);

  const handleBrowserPrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error("Print error:", e);
    }
  };

  const handleDownloadPdfAction = () => {
    const tag = selectedClass !== 'ALL' ? `_${selectedClass.replace(/\s+/g, '_')}` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Kartu_Peserta_CBT_SMAN1Toili${tag}_${dateStr}.pdf`;
    onDownloadPdf('student-cards-print-wrapper', filename);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 z-[9999] overflow-y-auto p-2 sm:p-4 flex items-center justify-center print:static print:bg-white print:p-0 print:z-auto pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      {/* Embedded print styles for zero-cutoff, isolated browser printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #student-cards-print-wrapper, #student-cards-print-wrapper * {
            visibility: visible !important;
          }
          #student-cards-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
          }
          .print-hidden, .print\\:hidden, button, select, input, .no-print {
            display: none !important;
          }
          .card-item-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-sheet-container {
            page-break-after: always !important;
            break-after: page !important;
            border: none !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
          }
          .page-sheet-container:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-6 border border-slate-100 max-h-[94vh] flex flex-col my-auto relative pointer-events-auto print:max-h-none print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none">
        
        {/* Modal Top Header (Hidden on print) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-3 print:hidden relative z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Printer size={18} />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                  Cetak & Unduh Kartu Peserta Ujian CBT
                </h3>
                <p className="text-xs text-slate-500">
                  SMAN 1 TOILI • Menampilkan {filtered.length} siswa ({studentsToRender.length} terpilih)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end relative z-30">
            {/* Download PDF Button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadPdfAction();
              }} 
              disabled={isGeneratingPDF || studentsToRender.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
              title="Unduh berkas PDF resmi berkualitas tinggi"
            >
              <Download size={15}/> {isGeneratingPDF ? 'Menyiapkan PDF...' : `Download PDF (${studentsToRender.length})`}
            </button>

            {/* Direct Browser Print Button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowserPrint();
              }} 
              disabled={studentsToRender.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
              title="Cetak langsung menggunakan printer (A4 6 kartu/lembar)"
            >
              <Printer size={15}/> Cetak Langsung (Print)
            </button>

            {/* Close Button */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              title="Tutup dialog"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            >
              <X size={16} /> <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filters (Hidden on print) */}
        <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 mt-3 mb-3 text-xs print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Filter Kelas */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Filter size={14} className="text-indigo-600" /> Kelas:
              </span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls} ({students.filter(s => s.class === cls).length} Siswa)</option>
                ))}
              </select>
            </div>

            {/* Search Student Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NISN, username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Layout Cards per Sheet */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <LayoutGrid size={14} className="text-indigo-600" /> Format:
              </span>
              <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setCardsPerPage(6)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    cardsPerPage === 6 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="6 kartu per lembar A4 (Rekomendasi hemat kertas)"
                >
                  6 Kartu / Lembar
                </button>
                <button
                  type="button"
                  onClick={() => setCardsPerPage(4)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    cardsPerPage === 4 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="4 kartu per lembar A4 (Ukuran lebih besar)"
                >
                  4 Kartu / Lembar
                </button>
              </div>
            </div>

          </div>

          {/* Selection control row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-slate-600">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors"
              >
                {selectAll && selectedStudentIds.length === filtered.length ? (
                  <CheckSquare size={16} className="text-indigo-600" />
                ) : (
                  <Square size={16} className="text-slate-400" />
                )}
                <span>Pilih Semua ({filtered.length} Siswa)</span>
              </button>

              <span className="text-slate-300">|</span>

              <span className="text-indigo-900 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-[11px]">
                {studentsToRender.length} dari {filtered.length} kartu terpilih untuk dicetak ({pages.length} Lembar A4)
              </span>
            </div>

            {selectedClass !== 'ALL' || searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('ALL');
                  setSearchQuery('');
                }}
                className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer text-[11px]"
              >
                Reset Semua Filter
              </button>
            ) : null}
          </div>
        </div>

        {/* PRINT CONTAINER / PREVIEW AREA */}
        <div 
          id="student-cards-container" 
          className="flex-1 overflow-y-auto pr-1 space-y-6 print:overflow-visible print:h-auto"
        >
          {studentsToRender.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl p-8">
              <AlertCircle size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Tidak ada kartu peserta yang dipilih atau ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">
                Silakan ubah filter kelas, kata kunci pencarian, atau klik 'Pilih Semua'.
              </p>
            </div>
          ) : (
            // Export Wrapper: Target of html2pdf and @media print
            <div id="student-cards-print-wrapper" className="w-full bg-white">
              {pages.map((pageStudents, pageIdx) => (
                <div 
                  key={`page-${pageIdx}`}
                  className="page-sheet-container mb-8 print:mb-0 print:border-none p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs relative"
                  style={{
                    pageBreakAfter: pageIdx === pages.length - 1 ? 'avoid' : 'always',
                    breakAfter: pageIdx === pages.length - 1 ? 'avoid' : 'page',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Page Sheet Banner for Screen View */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-dashed border-slate-200 text-slate-400 text-xs print:hidden">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText size={14} className="text-indigo-600" />
                      Lembar {pageIdx + 1} dari {pages.length} ({pageStudents.length} Kartu Siswa)
                    </span>
                    <span className="text-[11px] text-slate-500">Kertas Ukuran A4 Portrait</span>
                  </div>

                  {/* Grid of Cards */}
                  <div 
                    className={`grid ${cardsPerPage === 6 ? 'grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {pageStudents.map((s) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div 
                          key={s.id} 
                          className="card-item-avoid-break relative group"
                          style={{
                            pageBreakInside: 'avoid',
                            breakInside: 'avoid'
                          }}
                        >
                          {/* Selection Checkbox on screen preview */}
                          <div className="absolute top-2 right-2 z-20 print:hidden">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectStudent(s.id);
                              }}
                              className="p-1 rounded-md bg-white/90 hover:bg-white shadow-xs border border-slate-300 cursor-pointer"
                              title={isSelected ? 'Batalkan pilihan kartu ini' : 'Pilih kartu ini'}
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-indigo-600" />
                              ) : (
                                <Square size={16} className="text-slate-400" />
                              )}
                            </button>
                          </div>

                          {/* Dotted cut line hint */}
                          <div className="absolute -top-1.5 left-4 right-4 flex items-center justify-center pointer-events-none print:hidden opacity-40 group-hover:opacity-100 transition-opacity">
                            <span className="bg-white px-1 text-[9px] text-slate-400 flex items-center gap-1">
                              <Scissors size={10} /> Potong di sini
                            </span>
                          </div>

                          {/* THE CARD BOX */}
                          <div 
                            className="bg-white rounded-xl text-slate-900 overflow-hidden relative"
                            style={{
                              border: '1.5px solid #0f172a',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              boxSizing: 'border-box',
                              padding: '10px 12px 10px 12px'
                            }}
                          >
                            {/* KOP KARTU RESMI */}
                            <div className="flex items-center justify-between pb-1 relative">
                              <div className="w-10 flex justify-center shrink-0">
                                <TutWuriHandayaniLogo size={34} />
                              </div>

                              <div className="flex-1 text-center px-1">
                                <p 
                                  className="font-bold uppercase tracking-wider text-slate-700 leading-tight"
                                  style={{ fontSize: '7.5px' }}
                                >
                                  PEMERINTAH PROVINSI SULAWESI TENGAH
                                </p>
                                <p 
                                  className="font-bold uppercase tracking-wider text-slate-700 leading-tight"
                                  style={{ fontSize: '7.5px' }}
                                >
                                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                                </p>
                                <h4 
                                  className="font-black uppercase tracking-wide text-slate-900 leading-snug"
                                  style={{ fontSize: '11.5px' }}
                                >
                                  SMA NEGERI 1 TOILI
                                </h4>
                                <p 
                                  className="font-black uppercase text-indigo-900 leading-tight"
                                  style={{ fontSize: '9px', letterSpacing: '0.3px' }}
                                >
                                  KARTU PESERTA CBT (COMPUTER BASED TEST)
                                </p>
                                <p 
                                  className="font-semibold text-slate-600 leading-tight"
                                  style={{ fontSize: '7.5px' }}
                                >
                                  TAHUN AJARAN 2025/2026
                                </p>
                              </div>

                              <div className="w-10 flex justify-center shrink-0">
                                <CbtOfficialBadge size={34} />
                              </div>
                            </div>

                            {/* Garis Kop Ganda Resmi */}
                            <div style={{ margin: '3px 0 7px 0' }}>
                              <div style={{ borderTop: '2px solid #0f172a', height: '1.5px' }} />
                              <div style={{ borderTop: '1px solid #0f172a', height: '1px', marginTop: '1.5px' }} />
                            </div>

                            {/* ISI KARTU: DATA SISWA & AKUN */}
                            <div className="flex gap-2.5">
                              {/* Kolom Kiri: Data & Akun Login */}
                              <div className="flex-1 min-w-0">
                                <table 
                                  className="w-full text-slate-900 leading-snug" 
                                  style={{ fontSize: '9px', borderCollapse: 'collapse', border: 'none' }}
                                >
                                  <tbody>
                                    <tr style={{ border: 'none' }}>
                                      <td className="w-18 py-0.5 text-slate-500 font-semibold" style={{ border: 'none', padding: '1px 0' }}>Nama Peserta</td>
                                      <td className="w-2.5 text-center text-slate-500 font-bold" style={{ border: 'none', padding: '1px 0' }}>:</td>
                                      <td className="font-extrabold uppercase text-slate-900 truncate" style={{ border: 'none', padding: '1px 0' }}>
                                        {s.name}
                                      </td>
                                    </tr>
                                    <tr style={{ border: 'none' }}>
                                      <td className="py-0.5 text-slate-500 font-semibold" style={{ border: 'none', padding: '1px 0' }}>No. Peserta</td>
                                      <td className="text-center text-slate-500 font-bold" style={{ border: 'none', padding: '1px 0' }}>:</td>
                                      <td className="font-mono font-bold text-slate-800" style={{ border: 'none', padding: '1px 0' }}>
                                        {`2026-CBT-${(s.username || s.id).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`}
                                      </td>
                                    </tr>
                                    <tr style={{ border: 'none' }}>
                                      <td className="py-0.5 text-slate-500 font-semibold" style={{ border: 'none', padding: '1px 0' }}>Kelas / Tingkat</td>
                                      <td className="text-center text-slate-500 font-bold" style={{ border: 'none', padding: '1px 0' }}>:</td>
                                      <td className="font-bold text-slate-900" style={{ border: 'none', padding: '1px 0' }}>
                                        {s.class}
                                      </td>
                                    </tr>
                                    <tr style={{ border: 'none' }}>
                                      <td className="py-0.5 text-slate-500 font-semibold" style={{ border: 'none', padding: '1px 0' }}>Sesi / Ruang</td>
                                      <td className="text-center text-slate-500 font-bold" style={{ border: 'none', padding: '1px 0' }}>:</td>
                                      <td className="font-bold text-slate-800" style={{ border: 'none', padding: '1px 0' }}>
                                        {s.session || 'Sesi 1'} • Lab CBT SMAN 1 Toili
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>

                                {/* KOTAK KREDENSIAL LOGIN CBT */}
                                <div 
                                  className="mt-1.5 p-1.5 rounded-lg"
                                  style={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                                    <span 
                                      className="font-black uppercase tracking-wider text-indigo-900"
                                      style={{ fontSize: '7.5px' }}
                                    >
                                      KREDENSIAL LOGIN APLIKASI CBT
                                    </span>
                                    <span 
                                      className="font-semibold text-slate-400"
                                      style={{ fontSize: '7px' }}
                                    >
                                      Sifat: RAHASIA
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1 pt-1 font-mono" style={{ fontSize: '8.5px' }}>
                                    <div>
                                      <span className="text-[7.5px] text-slate-500 font-sans block">Username:</span>
                                      <span className="font-bold text-indigo-700">@{s.username}</span>
                                    </div>
                                    <div>
                                      <span className="text-[7.5px] text-slate-500 font-sans block">Password:</span>
                                      <span 
                                        className="font-bold text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-300 inline-block"
                                      >
                                        {s.password}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Kolom Kanan: Pas Foto 3x4 & Barcode */}
                              <div className="w-24 shrink-0 flex flex-col items-center justify-between">
                                {/* Box Foto 3x4 */}
                                <div 
                                  className="w-18 h-22 rounded-md flex flex-col items-center justify-center text-slate-400 relative overflow-hidden"
                                  style={{
                                    border: '1px dashed #94a3b8',
                                    backgroundColor: '#f8fafc'
                                  }}
                                >
                                  <GraduationCap size={20} className="text-slate-300 mb-0.5" />
                                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                                    FOTO 3 x 4
                                  </span>
                                  <span className="text-[6px] text-slate-300 text-center px-1">
                                    Cap/Stempel
                                  </span>
                                </div>

                                {/* Barcode Ujian */}
                                <div className="mt-1">
                                  <BarcodeSvg value={s.username || s.id} />
                                </div>
                              </div>
                            </div>

                            {/* BAGIAN BAWAH KARTU: TATA TERTIB & TANDA TANGAN */}
                            <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-end justify-between">
                              {/* Tata Tertib Singkat */}
                              <div className="text-slate-600 space-y-0.5" style={{ fontSize: '6.8px', maxWidth: '56%' }}>
                                <p className="font-bold text-slate-800">Tata Tertib Singkat:</p>
                                <p>1. Kartu wajib dibawa & diletakkan di atas meja saat ujian.</p>
                                <p>2. Dilarang memberitahukan password kepada peserta lain.</p>
                              </div>

                              {/* Pengesahan / Tanda Tangan */}
                              <div className="text-center" style={{ fontSize: '7px' }}>
                                <p className="text-slate-600 font-medium">Toili, 2026</p>
                                <p className="font-bold text-slate-800">Panitia Pelaksana CBT,</p>
                                <div className="h-6" /> {/* Space for signature */}
                                <div className="border-b border-slate-700 w-24 mx-auto" />
                                <p className="text-[6.5px] text-slate-500 font-medium mt-0.5">SMAN 1 TOILI</p>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar (Hidden on print) */}
        <div className="pt-3 border-t border-slate-200 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden relative z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>
              💡 <strong>Tips Cetak:</strong> Gunakan tombol <strong>'Download PDF'</strong> untuk mengunduh arsip dokumen atau <strong>'Cetak Langsung'</strong> untuk cetak via printer tanpa potongan halaman.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              type="button"
              onClick={handleBrowserPrint}
              disabled={studentsToRender.length === 0}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Printer size={14} /> Cetak via Printer
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
