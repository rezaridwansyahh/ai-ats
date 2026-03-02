import {
  Plus,
  ChevronRight,
  Eye,
  Pencil,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';

const PLACEHOLDER_JOBS = [
  { id: 1, title: 'Senior Frontend Developer', location: 'Jakarta',  candidates: 124, status: 'Active' },
  { id: 2, title: 'Backend Engineer',          location: 'Bandung',  candidates: 89,  status: 'Active' },
  { id: 3, title: 'UI/UX Designer',            location: 'Remote',   candidates: 56,  status: 'Kedaluwarsa' },
  { id: 4, title: 'Data Analyst',              location: 'Surabaya', candidates: 43,  status: 'Active' },
];

const PLACEHOLDER_TESTS = [
  { id: 1, title: 'Technical Assessment - Frontend', questions: 25, completions: 312 },
  { id: 2, title: 'Logical Reasoning Test',          questions: 40, completions: 198 },
  { id: 3, title: 'Culture Fit Assessment',           questions: 15, completions: 456 },
  { id: 4, title: 'Coding Challenge - Backend',       questions: 10, completions: 87  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 px-4 py-6 animate-in fade-in duration-300">
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jobs Open"            value={74} />
        <StatCard label="Ongoing Test Taker"   value={21} />
        <StatCard label="Candidate Pool"       value="2,647" />
        <StatCard label="Test Completion Rate" value="30.4%" />
      </div>

      {/* MIDDLE SECTION: Company Profile + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Company profile sudah lengkap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full rounded-full bg-muted h-2.5">
              <div className="bg-primary h-2.5 rounded-full w-full" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                View Page
              </Button>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Create Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Buat lowongan untuk mulai mendapatkan kandidat.
              </p>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4" />
                Create Job
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Create Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Buat tes sebagai bagian dari seleksi lowongan ataupun sebagai tes terpisah.
              </p>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4" />
                Create Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTTOM SECTION: My Jobs + My Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Jobs */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>My Jobs</CardTitle>
            <Button variant="ghost" size="sm">
              View all (896)
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLACEHOLDER_JOBS.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{job.candidates}</p>
                    <p className="text-xs text-muted-foreground">candidates</p>
                  </div>
                  <Badge variant={job.status === 'Kedaluwarsa' ? 'secondary' : 'default'}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Tests */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>My Test</CardTitle>
            <Button variant="ghost" size="sm">
              View all (4,254)
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLACEHOLDER_TESTS.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{test.title}</p>
                  <p className="text-xs text-muted-foreground">{test.questions} questions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{test.completions}</p>
                  <p className="text-xs text-muted-foreground">completions</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
