import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CandidateCard from '@/components/assessment-b/CandidateCard';
import Report from '@/components/assessment-b/Report';

export default function AssessmentBPage() {
  const [view, setView] = useState('card'); // 'card' | 'report'

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-[1100px] mx-auto px-4 pt-4 pb-2 flex items-center gap-2 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700 mr-2">Battery B · Profesional & Individual Contributor</span>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={view === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('card')}
            className={view === 'card' ? 'bg-teal-700 hover:bg-teal-800' : ''}
          >
            🧪 Tes Kandidat
          </Button>
          <Button
            variant={view === 'report' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('report')}
            className={view === 'report' ? 'bg-teal-700 hover:bg-teal-800' : ''}
          >
            📊 Laporan Asesor
          </Button>
        </div>
      </div>

      {view === 'card' ? <CandidateCard /> : <Report />}
    </div>
  );
}
