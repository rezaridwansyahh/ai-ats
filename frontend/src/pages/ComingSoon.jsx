import { Construction } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Construction className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Coming Soon
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This feature is currently under development and will be available soon.
        </p>
      </div>
    </div>
  )
}
