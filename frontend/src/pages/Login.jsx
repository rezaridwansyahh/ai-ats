import { LoginCard } from "@/components/auth/LoginCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-12 overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-white/3" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <img src="/Myralix_Logo_White.png" className="h-10 w-auto" alt="Myralix" />
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white font-display leading-tight">
            Streamline your<br />hiring process
          </h2>
          <p className="text-white/70 text-sm max-w-md leading-relaxed">
            AI-powered applicant tracking system that automates sourcing,
            screening, and onboarding — so you can focus on finding the right talent.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/40 text-xs">
          &copy; {new Date().getFullYear()} Myralix. All rights reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <LoginCard />
      </div>
    </div>
  )
}
