import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Plus, Trash2, Power, PowerOff, Loader2 } from "lucide-react"

export default function EmailNotifyManager({ emails, onAdd, onToggle, onDelete, loading }) {
  const [newEmail, setNewEmail] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    try {
      await onAdd(newEmail.trim(), newLabel.trim() || null)
      setNewEmail("")
      setNewLabel("")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 bg-card">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Internal Notification Emails</h3>
          <span className="text-[11px] text-muted-foreground ml-1">
            ({emails.filter(e => e.is_active).length} active)
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          These emails receive notifications when bookings are approved or rejected.
        </p>
      </div>

      {/* Email list */}
      <div className="divide-y divide-border/40">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mb-2 opacity-30" />
            <span className="text-xs">No notification emails configured</span>
          </div>
        ) : (
          emails.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                item.is_active ? "bg-card" : "bg-muted/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    item.is_active ? "bg-[#0A6E5C]" : "bg-muted-foreground/30"
                  }`}
                />
                <div className="min-w-0">
                  <span className="block truncate font-medium">{item.email}</span>
                  {item.label && (
                    <span className="block text-[11px] text-muted-foreground truncate">{item.label}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={item.is_active ? "Deactivate" : "Activate"}
                  onClick={() => onToggle(item.id, !item.is_active)}
                >
                  {item.is_active ? (
                    <Power className="h-3.5 w-3.5 text-[#0A6E5C]" />
                  ) : (
                    <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
                  title="Remove"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3 border-t border-border/60 bg-muted/20">
        <Input
          placeholder="email@example.com"
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="h-8 text-sm flex-1"
        />
        <Input
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="h-8 text-sm w-32"
        />
        <Button type="submit" size="sm" className="h-8 px-3" disabled={adding || !newEmail.trim()}>
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </form>
    </div>
  )
}
