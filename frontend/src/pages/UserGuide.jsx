import { useState } from 'react'
import {
  BookOpen, LogIn, Briefcase, UserPlus, Radar, Users,
  ScanSearch, Brain, CalendarCheck, ShieldCheck, FileSignature,
  LayoutDashboard, Inbox, LifeBuoy, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import imgLogin from '@/assets/user-guide/login.png'
import imgJobManagement from '@/assets/user-guide/job-management.png'
import imgSourceCandidate from '@/assets/user-guide/source-candidate.png'
import imgSourceManagement from '@/assets/user-guide/source-management.png'
import imgTalentPool from '@/assets/user-guide/talent-pool.png'
import imgAiScreening from '@/assets/user-guide/ai-screening.png'
import imgPsychAssessment from '@/assets/user-guide/psychological-assessment.png'
import imgInterview from '@/assets/user-guide/interview.png'
import imgBackgroundCheck from '@/assets/user-guide/background-check.png'
import imgOfferContract from '@/assets/user-guide/offering-contract.png'

const SECTIONS = [
  {
    id: 'login',
    icon: LogIn,
    title: 'Login',
    summary: 'Masuk ke Myralix dengan email dan password yang sudah terdaftar.',
    image: imgLogin,
    steps: [
      'Buka halaman login Myralix.',
      'Masukkan Email dan Password Anda.',
      'Klik tombol Sign In untuk masuk ke Dashboard.',
    ],
  },
  {
    id: 'job-management',
    icon: Briefcase,
    title: 'Job Management',
    summary: 'Membuat dan memposting lowongan baru.',
    image: imgJobManagement,
    steps: [
      'Buka menu Sourcing → Job Management, lalu klik "+ Create new job".',
      'Isi form dalam 4 tahap: Basics → Job Description → Pipeline & AI → Posting.',
      'Di Job Description, gunakan tombol AI Generate untuk membuat Summary, Responsibilities, dan Qualifications otomatis.',
      'Di Pipeline & AI, atur tahapan seleksi (misal Assessment → Interview).',
      'Di Posting, pilih Internal Hire Only atau Publish to Channel, lalu klik Publish Job.',
    ],
  },
  {
    id: 'source-candidate',
    icon: UserPlus,
    title: 'Source Candidate',
    summary: 'Menambahkan kandidat secara manual ke sebuah lowongan.',
    image: imgSourceCandidate,
    steps: [
      'Buka Sourcing → Source Candidate, pilih posisi yang dituju.',
      'Upload CV (PDF/DOCX) — sistem otomatis mem-parsing data kandidat, atau',
      'Klik "+ Add Candidate" untuk mengisi data kandidat secara manual.',
      'Kandidat yang tersimpan akan langsung masuk ke tahap AI Screening.',
    ],
  },
  {
    id: 'source-management',
    icon: Radar,
    title: 'Source Management',
    summary: 'Mengelola dan memantau performa setiap channel rekrutmen.',
    image: imgSourceManagement,
    steps: [
      'Buka Sourcing → Source Management untuk melihat semua channel (JobStreet, LinkedIn, referral, dll).',
      'Klik "+ Add Source" untuk menambahkan channel baru beserta kategorinya.',
      'Gunakan data performa channel untuk menilai efektivitas sourcing.',
    ],
  },
  {
    id: 'talent-pool',
    icon: Users,
    title: 'Talent Pool',
    summary: 'Kumpulan kandidat yang tersimpan untuk digunakan di lowongan mana pun.',
    image: imgTalentPool,
    steps: [
      'Buka Sourcing → Talent Pool, gunakan filter Position, Education, Score, City, atau Skills untuk mencari kandidat.',
      'Klik "+ Add" pada kandidat, pilih job yang sesuai, lalu klik Add to Job.',
      'Bisa juga upload CV manual (satuan atau ZIP) agar kandidat masuk ke Talent Pool.',
    ],
  },
  {
    id: 'ai-screening',
    icon: ScanSearch,
    title: 'AI Screening',
    summary: 'Tahap pertama seleksi: Parsing → AI Matching → Follow-up Q&A.',
    image: imgAiScreening,
    steps: [
      'Pilih posisi, lalu klik kandidat yang ingin diproses.',
      'Step 1 Parsing berjalan otomatis — sistem mengekstrak data dari CV.',
      'Step 2 AI Matching — atur Role Profile dan bobot kriteria (Criteria & Weights), lalu jalankan Run AI Matching.',
      'Step 3 Follow-up Q&A — buat pertanyaan (Regenerate atau Add Custom), lalu Send to Candidate.',
      'Setelah kandidat merespons, buat keputusan Advance / Hold di Response Inbox.',
    ],
  },
  {
    id: 'psychological-assessment',
    icon: Brain,
    title: 'Psychological Assessment',
    summary: 'Mengirim tes psikometri (Battery A/B/C/D) kepada kandidat.',
    image: imgPsychAssessment,
    steps: [
      'Pilih kandidat yang sudah Advance dari AI Screening.',
      'Pilih Battery/Assessment yang sesuai, lalu klik Send Invitation.',
      'Klik Generate URL untuk mendapatkan link — bisa Copy, Revoke, atau Send Invitation Email.',
      'Kandidat mengerjakan tes melalui link tersebut; hasil otomatis tercatat di sistem.',
    ],
  },
  {
    id: 'interview',
    icon: CalendarCheck,
    title: 'Interview',
    summary: 'Menjadwalkan interview, mengisi rubrik, dan membagikan link interview.',
    image: imgInterview,
    steps: [
      'Pilih kandidat, lalu klik "+ Add session" untuk membuat jadwal interview.',
      'Konfirmasi jadwal setelah kandidat diberi tahu (via WhatsApp/Email).',
      'Isi Rubric (competency framework) — bisa manual atau pakai Generate AI Anchor.',
      'Buat Questions interview, lalu generate Interview Link untuk dibagikan.',
    ],
  },
  {
    id: 'background-check',
    icon: ShieldCheck,
    title: 'Background Check',
    summary: '4 tahap: Claims → Consent → Tracker → Verdict.',
    image: imgBackgroundCheck,
    steps: [
      'Claims — klik Extract from CV untuk re-check data kandidat, atau tambahkan data manual.',
      'Consent — Generate Link persetujuan, kirim ke kandidat untuk ditandatangani secara elektronik.',
      'Tracker — buat Lanes untuk memvalidasi tiap dokumen (ijazah, SKCK, dll) hingga semua Pass.',
      'Verdict — tentukan keputusan akhir: Pass, Pass with Concerns, atau Fail.',
    ],
  },
  {
    id: 'offering-contract',
    icon: FileSignature,
    title: 'Offering & Contract',
    summary: '5 tahap: Intake → Build → Review → Send → Contract.',
    image: imgOfferContract,
    steps: [
      'Intake — input referensi gaji dan biaya tambahan dari kandidat.',
      'Build — upload template offer letter (sekali di Settings), lalu isi Offer Letter Fields & Compensation Build.',
      'Review — generate dokumen, lakukan review/edit, lalu minta Approval dari Hiring Manager.',
      'Send — upload offer letter final, kirim ke kandidat untuk ditandatangani.',
      'Contract — upload kontrak final yang sudah ditandatangani untuk menyelesaikan proses.',
    ],
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    summary: 'Pusat kendali harian — bukan laporan analitik, tapi pengingat hal yang perlu perhatian segera.',
    steps: [
      'Manager Inbox menampilkan item paling mendesak: hasil AI Screening yang perlu ditinjau, wawancara yang perlu dijadwalkan, scorecard yang belum diisi, penawaran yang melewati SLA, dan peringatan Background Check.',
      'Panel kanan menampilkan lowongan mendekati deadline, pipeline yang menipis, approver tertunda, dan penggunaan kuota AI.',
      'Biasakan membuka Dashboard di awal hari kerja sebelum membuka modul lain.',
    ],
  },
  {
    id: 'manager-inbox',
    icon: Inbox,
    title: 'Manager Inbox & Persetujuan',
    summary: 'Tempat Hiring Manager menyetujui requisisi, mengisi scorecard, dan memberi feedback.',
    steps: [
      'Tab Approvals — menyetujui atau menolak requisisi lowongan dan penawaran kerja.',
      'Tab Scorecards Owed — mengisi scorecard wawancara yang sudah selesai dilaksanakan.',
      'Tab Feedback Requests — merespons permintaan masukan dari rekruter.',
      'Tab Heads-Up — notifikasi informatif (kandidat diterima, karyawan baru mulai bekerja, dll).',
    ],
  },
  {
    id: 'recovery-hub',
    icon: LifeBuoy,
    title: 'Recovery Hub',
    summary: 'Mengelola kandidat atau rekrutmen yang berisiko terhenti.',
    steps: [
      'Menangani situasi seperti kandidat ghosting, offer ditolak, atau gagal Background Check.',
      'Sistem menyarankan kandidat pengganti terbaik beserta persentase kecocokan.',
      'Tindakan cepat: Promosikan Kandidat Cadangan, Sumber dari Talent Pool, Publikasikan Ulang Posisi, atau Tahan & Ingatkan.',
      'Kandidat yang gagal Background Check masuk ke segmen terkunci "BG Concerns" sesuai UU PDP 27/2022 dan tidak boleh dipindahkan manual.',
    ],
  },
]

export default function UserGuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">User Guide</h1>
          <p className="text-sm text-muted-foreground">Panduan singkat menggunakan Myralix, dari sourcing sampai kontrak kerja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Section nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = section.id === activeId
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveId(section.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left whitespace-nowrap lg:whitespace-normal transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{section.title}</span>
                {isActive && <ChevronRight className="h-4 w-4 hidden lg:block flex-shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Section content */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{active.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{active.summary}</p>
          </div>

          {active.image && (
            <img
              src={active.image}
              alt={`Tampilan ${active.title} di Myralix`}
              className="w-full rounded-lg border border-border"
            />
          )}

          <ol className="space-y-2">
            {active.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
