import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative flex-col justify-between p-12 overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 -translate-y-1/2 right-[-80px] w-[280px] h-[280px] rounded-full bg-white/4" />

        {/* Floating accent blobs */}
        <div className="absolute top-1/4 left-1/3 w-24 h-24 rounded-full bg-white/8 blur-2xl" />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-[#14B8A6]/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <img src={`${import.meta.env.BASE_URL}Myralix_Logo_White.png`} className="h-9 w-auto" alt="Myralix" />
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-6">
          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['AI-Powered', 'Multi-Platform', 'Automated RPA'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/12 text-white/85 border border-white/15 backdrop-blur-sm"
              >
                <span className="h-1 w-1 rounded-full bg-[#14B8A6]" />
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-3xl font-bold text-white font-display leading-snug">
            Streamline your<br />hiring process
          </h2>
          <p className="text-white/65 text-sm max-w-sm leading-relaxed">
            AI-powered applicant tracking system that automates sourcing,
            screening, and onboarding — so you can focus on finding the right talent.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 pt-2 border-t border-white/10">
            {[
              { num: '3×', label: 'Faster hiring' },
              { num: '60%', label: 'Less manual work' },
              { num: '99.9%', label: 'Uptime SLA' },
            ].map(({ num, label }) => (
              <div key={label} className="pt-4">
                <p className="text-xl font-bold text-white font-display">{num}</p>
                <p className="text-[11px] text-white/55 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-white/35 text-xs">
            &copy; {new Date().getFullYear()} Myralix. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            <span className="text-[10px] font-semibold text-white/70 tracking-wide">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 relative">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle, #0A6E5C 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 w-full max-w-sm">
          <LoginCard />
        </div>
      </div>
    </div>
  )
}
