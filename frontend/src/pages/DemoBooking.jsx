import { useState, useEffect, useCallback } from "react"
import { getAll, approve, reject } from "@/api/landing.api.js"
import * as emailNotifyApi from "@/api/email-notify.api.js"
import { hasPermission } from "@/utils/permissions"
import AdminCalendar from "@/components/demo-booking/AdminCalendar"
import EmailNotifyManager from "@/components/demo-booking/EmailNotifyManager"

export default function DemoBookingPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifyEmails, setNotifyEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(true)

  const canUpdate = hasPermission("Users", "Demo Booking", "update")

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAll()
      setBookings(res.data?.data || [])
    } catch (err) {
      console.error("Failed to fetch bookings:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true)
    try {
      const res = await emailNotifyApi.getAll()
      setNotifyEmails(res.data?.data || [])
    } catch (err) {
      console.error("Failed to fetch notify emails:", err)
    } finally {
      setEmailsLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])
  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleApprove = async (id, conference_link) => {
    await approve(id, conference_link)
    await fetchBookings()
  }

  const handleReject = async (id, rejection_reason) => {
    await reject(id, rejection_reason)
    await fetchBookings()
  }

  const handleAddEmail = async (email, label) => {
    await emailNotifyApi.create(email, label)
    await fetchEmails()
  }

  const handleToggleEmail = async (id, is_active) => {
    await emailNotifyApi.update(id, { is_active })
    await fetchEmails()
  }

  const handleDeleteEmail = async (id) => {
    await emailNotifyApi.remove(id)
    await fetchEmails()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Demo Booking</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          View and manage demo booking requests from the landing page.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Loading bookings...
        </div>
      ) : (
        <AdminCalendar
          bookings={bookings}
          onApprove={handleApprove}
          onReject={handleReject}
          canUpdate={canUpdate}
        />
      )}

      {canUpdate && (
        <EmailNotifyManager
          emails={notifyEmails}
          onAdd={handleAddEmail}
          onToggle={handleToggleEmail}
          onDelete={handleDeleteEmail}
          loading={emailsLoading}
        />
      )}
    </div>
  )
}
