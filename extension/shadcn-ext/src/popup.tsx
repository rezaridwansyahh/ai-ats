import "./style.css"
import { useState, useEffect } from "react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Home,
  Search,
  Briefcase,
  Users,
  FileText,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  RefreshCw,
  Loader2,
  MapPin,
  Clock,
  Building2,
  Save,
  Check,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────
interface Job {
  title: string
  company: string
  logoUrl: string
  located: string
  posted: string
}

// ─── Sidebar Config ───────────────────────────────────────────
const navItems = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: Search, label: "Search", id: "search" },
  { icon: Briefcase, label: "Jobs", id: "jobs" },
  { icon: Users, label: "Candidates", id: "candidates" },
  { icon: FileText, label: "Templates", id: "templates" },
  { icon: Bell, label: "Notifications", id: "notifications" },
]

const bottomItems = [
  { icon: Settings, label: "Settings", id: "settings" },
]

// ─── Sidebar Item Component ───────────────────────────────────
function SidebarItem({
  icon: Icon,
  label,
  isActive,
  isCollapsed,
  onClick,
}: {
  icon: any
  label: string
  isActive: boolean
  isCollapsed: boolean
  onClick: () => void
}) {
  const button = (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm
        transition-colors duration-150
        ${isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }
        ${isCollapsed ? "justify-center px-2" : ""}
      `}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

// ─── Dashboard Page ───────────────────────────────────────────
function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())

  const scrapeJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab?.id) {
        setError("No active tab found.")
        setLoading(false)
        return
      }

      chrome.tabs.sendMessage(tab.id, { type: "SCRAPE" }, (response) => {
        if (chrome.runtime.lastError) {
          setError("Could not connect to page. Make sure you're on a supported site.")
          setLoading(false)
          return
        }

        if (response?.data && response.data.length > 0) {
          setJobs(response.data)
          setSavedJobs(new Set())
        } else {
          setError("No job listings found on this page.")
        }

        setLoading(false)
      })
    } catch (err) {
      setError("Something went wrong while scraping.")
      setLoading(false)
    }
  }

  const saveJob = async (job: Job, index: number) => {
    setSavingIndex(index)

    try {
      const res = await fetch("http://localhost:3000/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          location: job.located,
          posted: job.posted,
          logoUrl: job.logoUrl,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      setSavedJobs((prev) => new Set(prev).add(index))
    } catch (err) {
      alert("Failed to save job. Is your backend running?")
    } finally {
      setSavingIndex(null)
    }
  }

  const saveAllJobs = async () => {
    for (let i = 0; i < jobs.length; i++) {
      if (!savedJobs.has(i)) {
        await saveJob(jobs[i], i)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Scrape job listings from the current page
          </p>
        </div>
        <div className="flex items-center gap-2">
          {jobs.length > 0 && (
            <Button
              onClick={saveAllJobs}
              size="sm"
              variant="outline"
              className="px-4 py-2"
            >
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save All
              </span>
            </Button>
          )}
          <Button
            onClick={scrapeJobs}
            disabled={loading}
            size="sm"
            className="px-4 py-2"
          >
            <span className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? "Scraping..." : "Scrape Page"}
            </span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xl font-bold">{jobs.length}</p>
            <p className="text-xs text-muted-foreground">Jobs Found</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xl font-bold">
              {new Set(jobs.map((j) => j.company)).size}
            </p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xl font-bold">{savedJobs.size}</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No jobs scraped yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Navigate to JobStreet and click "Scrape Page"
          </p>
        </div>
      )}

      {/* Jobs Table */}
      {jobs.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-[380px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px] text-center">#</TableHead>
                  <TableHead className="w-[70px] text-center">Action</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Posted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      {savedJobs.has(index) ? (
                        <Button size="sm" variant="ghost" disabled className="h-7 px-2">
                          <span className="flex items-center gap-1">
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-green-500">Saved</span>
                          </span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          disabled={savingIndex === index}
                          onClick={() => saveJob(job, index)}
                        >
                          <span className="flex items-center gap-1">
                            {savingIndex === index ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs">
                              {savingIndex === index ? "..." : "Save"}
                            </span>
                          </span>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      {job.logoUrl ? (
                        <img
                          src={job.logoUrl}
                          alt=""
                          className="h-7 w-7 rounded object-contain bg-white border border-border"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium leading-tight truncate max-w-[180px]">
                        {job.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {job.company}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="text-xs truncate max-w-[90px]">{job.located}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="text-xs whitespace-nowrap">{job.posted}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────
function IndexPopup() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? "w-[52px]" : "w-[180px]"

  return (
    <div className="w-[800px] h-[600px] flex bg-background text-foreground">
      <TooltipProvider>
        {/* ── Sidebar ── */}
        <aside
          className={`
            ${sidebarWidth} h-full flex flex-col border-r border-border
            bg-card transition-all duration-200 shrink-0
          `}
        >
          {/* Logo / Brand */}
          <div className={`flex items-center h-[52px] px-3 ${collapsed ? "justify-center" : "gap-2"}`}>
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm truncate">ATS Extension</span>
            )}
          </div>

          <Separator />

          {/* Nav Items */}
          <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                isCollapsed={collapsed}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>

          <Separator />

          {/* Bottom Items */}
          <div className="flex flex-col gap-1 p-2">
            {bottomItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                isCollapsed={collapsed}
                onClick={() => setActiveTab(item.id)}
              />
            ))}

            <SidebarItem
              icon={User}
              label="Profile"
              isActive={activeTab === "profile"}
              isCollapsed={collapsed}
              onClick={() => setActiveTab("profile")}
            />

            {/* Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm
                text-muted-foreground hover:bg-accent hover:text-accent-foreground
                transition-colors duration-150"
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-[52px] flex items-center justify-between px-4 border-b border-border shrink-0">
            <h1 className="text-sm font-semibold capitalize">{activeTab}</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "dashboard" && <DashboardPage />}

            {activeTab === "search" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Search</h2>
                <p className="text-sm text-muted-foreground">Search candidates, jobs, and more.</p>
              </div>
            )}

            {activeTab === "jobs" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Jobs</h2>
                <p className="text-sm text-muted-foreground">Manage your job listings.</p>
              </div>
            )}

            {activeTab === "candidates" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Candidates</h2>
                <p className="text-sm text-muted-foreground">View and manage candidates.</p>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Templates</h2>
                <p className="text-sm text-muted-foreground">Message and email templates.</p>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Your recent notifications.</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Settings</h2>
                <p className="text-sm text-muted-foreground">Configure your extension.</p>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your account details.</p>
              </div>
            )}
          </div>
        </main>
      </TooltipProvider>
    </div>
  )
}

export default IndexPopup