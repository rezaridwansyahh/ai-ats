import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import ModuleLayout from "./components/layout/ModuleLayout"
import Dashboard from "./pages/Dashboard"
import Karyawan from "./pages/Karyawan"
import KaryawanDetail from "./pages/KaryawanDetail"
import ScanDokumen from "./pages/ScanDokumen"
import Impor from "./pages/Import"
import Demografi from "./pages/Demografi"
import Setting from "./pages/Setting"
import Notification from "./pages/Notification"
import Credit from "./pages/CreditAi"
import Attendance from "./pages/Attendance"
import AttendanceDashboard from "./pages/AttendanceDashboard"
import AttendanceEvent from "./pages/AttendanceEvent"
import AttendanceImport from "./pages/AttendanceImport"
import AttendanceRekap from "./pages/AttendanceRekap"
import AttendanceRekapDetail from "./pages/AttendanceRekapDetail"

function ComingSoon() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Halaman ini belum dibangun.
    </div>
  )
}

function App() {
  return (
    <>
      <Routes>
        <Route element={<ModuleLayout />}>
          {/* People Hub */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/karyawan" element={<Karyawan />} />
          <Route path="/karyawan/:id" element={<KaryawanDetail />} />
          <Route path="/dashboard" element={<Demografi />} />
          <Route path="/pengingat" element={<Notification />} />
          <Route path="/impor" element={<Impor />} />
          <Route path="/scan" element={<ScanDokumen />} />
          <Route path="/pengaturan" element={<Setting />} />
          <Route path="/kredit" element={<Credit />} />

          {/* Attendance Intelligence */}
          <Route path="/attendance" element={<Navigate to="/attendance/beranda" replace />} />
          <Route path="/attendance/beranda" element={<Attendance />} />
          <Route path="/attendance/dashboard" element={<AttendanceDashboard />} />
          <Route path="/attendance/rekap" element={<AttendanceRekap />} />
          <Route path="/attendance/rekap/:nik" element={<AttendanceRekapDetail />} />
          <Route path="/attendance/cuti" element={<ComingSoon />} />
          <Route path="/attendance/impor" element={<AttendanceImport />} />
          <Route path="/attendance/absen" element={<AttendanceEvent />} />
          <Route path="/attendance/pengaturan" element={<ComingSoon />} />

          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App