import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompanyCareers } from '@/api/careers.api';

// Scoped to this public page only — the admin app has its own font stack.
function CareerFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
    />
  );
}

export default function CareersListPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workOption, setWorkOption] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getCompanyCareers(slug);
        if (cancelled) return;
        setCompany(data.company);
        setJobs(data.jobs || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.status === 404 ? 'This careers page could not be found.' : 'Something went wrong loading this page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const locations = useMemo(() => [...new Set(jobs.map((j) => j.job_location).filter(Boolean))], [jobs]);

  const filtered = useMemo(() => jobs.filter((j) => {
    const matchesQuery = !query || j.job_title?.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = !location || j.job_location === location;
    const matchesOption = !workOption || j.work_option === workOption;
    return matchesQuery && matchesLocation && matchesOption;
  }), [jobs, query, location, workOption]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FB] p-8">
        <div className="max-w-[1040px] mx-auto space-y-4 pt-10">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-24 w-full mt-6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F6FB] flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-[#1B2420] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FB] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <CareerFonts />

      <header className="bg-white border-b border-[#E6E2D8]">
        <div className="max-w-[1040px] mx-auto px-5 h-16 flex items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-[#640199] text-white flex items-center justify-center font-bold">
              {company.name?.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-[#1B2420]">{company.name}</div>
            <div className="text-xs text-[#66706B] -mt-0.5">Careers</div>
          </div>
        </div>
      </header>

      <main className="flex-1">
      <section className="max-w-[1040px] mx-auto px-5 pt-11 pb-7">
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }} className="text-[40px] leading-[1.1] text-[#1B2420] mb-2.5">
          Grow with <em className="not-italic text-[#640199]">{company.name}</em>
        </h1>
        {company.description && (
          <p className="text-[#66706B] max-w-xl">{company.description}</p>
        )}
      </section>

      <section className="max-w-[1040px] mx-auto px-5 pb-12">
        <div className="flex flex-wrap gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#66706B]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles, e.g. engineer, sales…"
              className="pl-9 bg-white border-[#E6E2D8] rounded-[10px]"
            />
          </div>
          <Select value={location || 'all'} onValueChange={(v) => setLocation(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px] bg-white border-[#E6E2D8] rounded-[10px]"><SelectValue placeholder="All locations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={workOption || 'all'} onValueChange={(v) => setWorkOption(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px] bg-white border-[#E6E2D8] rounded-[10px]"><SelectValue placeholder="All work types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All work types</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#E6E2D8] rounded-[14px] p-5 text-[#66706B] text-sm">
              No open positions match your filters right now.
            </div>
          ) : filtered.map((job) => (
            <Link
              key={job.id}
              to={`/careers/${slug}/jobs/${job.id}`}
              className="bg-white border border-[#E6E2D8] hover:border-[#4757EA] rounded-[14px] px-5 py-4 flex items-center gap-4 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1B2420] mb-1">{job.job_title}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-[#66706B]">
                  {job.job_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.job_location}</span>}
                  {job.work_type && <span>· {job.work_type}</span>}
                </div>
              </div>
              {job.work_option && (
                <span className="bg-[#F1EAF8] text-[#640199] rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0">
                  {job.work_option}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-[#66706B] shrink-0" />
            </Link>
          ))}
        </div>
      </section>
      </main>

      <footer className="border-t border-[#E6E2D8] bg-white text-[#66706B] text-xs py-4">
        <div className="max-w-[1040px] mx-auto px-5 flex items-center justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} {company.name}</span>
          <span>Powered by <b className="text-[#640199]">Myralix</b></span>
        </div>
      </footer>
    </div>
  );
}
