import { useState, useEffect, useCallback } from "react"
import { getAll, approve, reject } from "@/api/landing.api.js"
import { hasPermission } from "@/utils/permissions"
import AdminCalendar from "@/components/demo-booking/AdminCalendar"

export default function DemoBookingPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleApprove = async (id, conference_link) => {
    await approve(id, conference_link)
    await fetchBookings()
  }

  const handleReject = async (id, rejection_reason) => {
    await reject(id, rejection_reason)
    await fetchBookings()
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
    </div>
  )
}
