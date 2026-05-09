import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CandidateCard from '@/components/assessment-b/CandidateCard';
import Report from '@/components/assessment-b/Report';

export default function AssessmentBPage() {
  const [view, setView] = useState('card'); // 'card' | 'report'

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-gradient-to-r from-[#064E3B] to-[#0A6E5C] px-6 py-3.5 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <svg width="26" height="26" viewBox="-50 -10 220 220" xmlns="http://www.w3.org/2000/svg">
              <path d="M30,10 C70,30 90,70 60,100 C30,130 70,170 90,190" stroke="url(#lgb1)" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M90,10 C50,30 30,70 60,100 C90,130 70,170 30,190" stroke="url(#lgb2)" strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="60" cy="100" r="8" fill="#fff" opacity=".9" />
              <defs>
                <linearGradient id="lgb1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A6E5C" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <linearGradient id="lgb2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#0A6E5C" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className="text-white font-bold text-lg tracking-wider"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              MYRALIX
            </span>
            <span className="hidden md:inline-block w-px h-5 bg-white/25" />
            <span className="hidden md:inline-block text-white/80 text-[11px] uppercase tracking-wider font-semibold">
              Battery B · Profesional & IC
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold border border-white/30">
              v10
            </span>
            <Button
              size="sm"
              onClick={() => setView('card')}
              className={
                view === 'card'
                  ? 'bg-white text-teal-800 hover:bg-white/90 h-8'
                  : 'bg-transparent text-white hover:bg-white/15 hover:text-white border border-white/30 h-8'
              }
            >
              Tes Kandidat
            </Button>
            <Button
              size="sm"
              onClick={() => setView('report')}
              className={
                view === 'report'
                  ? 'bg-white text-teal-800 hover:bg-white/90 h-8'
                  : 'bg-transparent text-white hover:bg-white/15 hover:text-white border border-white/30 h-8'
              }
            >
              Laporan Asesor
            </Button>
          </div>
        </div>
      </nav>

      {view === 'card' ? <CandidateCard /> : <Report />}
    </div>
  );
}
