import React from 'react';

interface FormattedContentProps {
  text: string;
  qId?: string;
  fontSizeClass?: string;
}

export function FormattedContent({ text, qId, fontSizeClass = "text-base md:text-lg" }: FormattedContentProps) {
  const renderDiagram = () => {
    return null;
  };

  const blocks = text.split('\n\n');

  return (
    <div className="space-y-3 sm:space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Render Markdown Table (Mobile Responsive)
        if (trimmed.includes('|') && trimmed.includes('---')) {
          const lines = trimmed.split('\n').filter(l => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const parseRow = (line: string) => line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
            const headers = parseRow(lines[0]);
            const rows = lines.slice(2).map(parseRow);

            return (
              <div key={idx} className="my-3 sm:my-4 rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-xs">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[280px]">
                    <thead className="bg-indigo-900 text-white font-bold">
                      <tr>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-2.5 sm:p-3.5 border-b border-indigo-800 uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rows.map((r, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 sm:p-3.5 text-slate-800 font-medium leading-normal">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-1 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 font-medium flex items-center justify-between sm:hidden">
                  <span>← Usap tabel ke samping jika terpotong →</span>
                </div>
              </div>
            );
          }
        }

        // Render STIMULUS ANBK Box
        if (trimmed.startsWith('[STIMULUS]') || trimmed.startsWith('**Stimulus:**') || trimmed.startsWith('Stimulus:')) {
          const stimulusText = trimmed
            .replace(/^\[STIMULUS\]/i, '')
            .replace(/^\*\*Stimulus:\*\*/i, '')
            .replace(/^Stimulus:/i, '')
            .trim();

          return (
            <div key={idx} className="bg-gradient-to-br from-indigo-50/90 to-blue-50/90 border-l-4 border-indigo-600 p-3.5 sm:p-4 rounded-r-2xl shadow-xs my-2.5 sm:my-3 border-y border-r border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center bg-indigo-600 text-white font-black text-[9px] sm:text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                  STIMULUS ANBK / FISIKA
                </span>
              </div>
              <p className={`${fontSizeClass} text-slate-800 font-normal leading-relaxed whitespace-pre-wrap`}>
                {stimulusText}
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className={`${fontSizeClass} text-slate-800 leading-relaxed whitespace-pre-wrap tracking-tight sm:tracking-normal`}>
            {trimmed}
          </p>
        );
      })}

      {renderDiagram()}
    </div>
  );
}
