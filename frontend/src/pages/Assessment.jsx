import { Construction } from 'lucide-react';

export default function AssessmentPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
          <Construction className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Under Construction
        </h1>
        <p className="text-slate-600 leading-relaxed">
          Halaman <strong>Selection/Assessment</strong> sedang dalam tahap pengembangan.
          Fitur ini akan segera tersedia.
        </p>
        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-slate-500">
            Modul Assessment • Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
}
