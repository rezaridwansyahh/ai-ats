import { RegisterCard } from "@/components/auth/RegisterCard";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-white/3" />
        </div>

        <div className="relative z-10">
          <img src="/Myralix_Logo_White.png" className="h-10 w-auto" alt="Myralix" />
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white font-display leading-tight">
            Start building<br />your dream team
          </h2>
          <p className="text-white/70 text-sm max-w-md leading-relaxed">
            Join Myralix and streamline your entire recruitment pipeline — from
            job posting to onboarding, all in one platform.
          </p>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          &copy; {new Date().getFullYear()} Myralix. All rights reserved.
        </p>
      </div>

      {/* Right panel — register form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <RegisterCard />
      </div>
    </div>
  )
}
