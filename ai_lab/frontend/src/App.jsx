import { Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import PeopleHubLayout from "./components/layout/PeopleHub-Layout"
import Dashboard from "./pages/Dashboard"
import Karyawan from "./pages/Karyawan"
import KaryawanDetail from "./pages/KaryawanDetail"
import ScanDokumen from "./pages/ScanDokumen"
import Impor from "./pages/Import"
import Demografi from "./pages/Demografi"
import Setting from "./pages/Setting"
import Notification from "./pages/Notification"


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
        <Route element={<PeopleHubLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/karyawan" element={<Karyawan />} />
          <Route path="/karyawan/:id" element={<KaryawanDetail />} />
          <Route path="/scan" element={<ScanDokumen />} />
          <Route path="/impor" element={<Impor />} />
          <Route path="/dashboard" element={<Demografi />} />
          <Route path="/pengaturan" element={<Setting />} />
          <Route path="/pengingat" element={<Notification />} />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App