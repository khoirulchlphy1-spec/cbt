import React from 'react';
import { GraduationCap, X } from 'lucide-react';

interface QuestionModalProps {
  editingQuestionIdx: number | null;
  questionFormData: {
    id: string | null;
    text: string;
    options: string[];
    answer: number;
  };
  setQuestionFormData: React.Dispatch<React.SetStateAction<{
    id: string | null;
    text: string;
    options: string[];
    answer: number;
  }>>;
  onClose: () => void;
  onSaveQuestion: (e: React.FormEvent) => void;
}

export function QuestionModal({
  editingQuestionIdx,
  questionFormData,
  setQuestionFormData,
  onClose,
  onSaveQuestion
}: QuestionModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <GraduationCap size={20} className="mr-2 text-indigo-600"/>
            {editingQuestionIdx !== null ? 'Edit Soal Ujian' : 'Tambah Soal Ujian Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSaveQuestion} className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan / Soal</label>
            <textarea 
              required
              rows={3}
              className="w-full p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tuliskan soal ujian..."
              value={questionFormData.text}
              onChange={e => setQuestionFormData({ ...questionFormData, text: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Pilihan Jawaban (A-E)</label>
            {questionFormData.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2">
                <span className="w-6 font-bold text-xs text-slate-500">{String.fromCharCode(65 + oIdx)}.</span>
                <input 
                  type="text" 
                  required
                  className="flex-1 p-2.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}`}
                  value={opt}
                  onChange={e => {
                    const newOpts = [...questionFormData.options];
                    newOpts[oIdx] = e.target.value;
                    setQuestionFormData({ ...questionFormData, options: newOpts });
                  }}
                />
                <input 
                  type="radio" 
                  name="correctAnswer" 
                  checked={questionFormData.answer === oIdx}
                  onChange={() => setQuestionFormData({ ...questionFormData, answer: oIdx })}
                  title="Tandai sebagai kunci jawaban"
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            ))}
            <p className="text-[11px] text-slate-400 italic mt-1">*Pilih radio button di kanan pilihan yang menjadi Kunci Jawaban.</p>
          </div>

          <div className="pt-4 flex gap-3 border-t">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Simpan Soal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
