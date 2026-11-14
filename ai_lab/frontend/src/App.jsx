import { Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import PeopleHubLayout from "./components/layout/PeopleHub-Layout"
import Dashboard from "./pages/Dashboard"
import Karyawan from "./pages/Karyawan"
import KaryawanDetail from "./pages/KaryawanDetail"

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
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App