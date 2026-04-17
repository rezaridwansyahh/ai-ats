import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Loader2, Pencil, Trash2, Upload, Sparkles, X, Star, Check,
  Bold, Italic, Underline, List, ListOrdered, Link, Bot, Home, Briefcase, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getByJobId } from '@/api/job-posting-seek.api'
import { getByJobPostId } from '@/api/job-sourcing.api'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import linkedin from '@/assets/logos/linkedin.png';
import seek from '@/assets/logos/seek.png';
import glints from '@/assets/logos/glints.png';
import instagram from '@/assets/logos/instagram.png';
import facebook from '@/assets/logos/facebook.png';
import whatsapp from '@/assets/logos/whatsapp.png';

const LOGOS = { linkedin, seek, glints, instagram, facebook, whatsapp };

const PUBLIC_CHANNELS = [
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'seek', name: 'Seek' },
  { id: 'glints', name: 'Glints' }
];

const PRIVATE_CHANNELS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'whatsapp', name: 'WhatsApp' }
];

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function JobListStep({ selectedJob }) {
  const [jobPost, setJobPost] = useState(null);
  const [jobSourcing, setJobSourcing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null)

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const post = await getByJobId(selectedJob.id);
        setJobPost(post?.data?.jobPosts);
        const sourcing = await getByJobPostId(post?.data?.jobPosts?.id);
        setJobSourcing(sourcing?.data?.postings);
      } catch(err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedJob.id]);

  return (
    <div className="space-y-5">
      {/* ── Section A: Selected Job Banner ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{selectedJob.job_title}</h3>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[selectedJob.status] || ''}`}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {selectedJob.job_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>
                  )}
                  {selectedJob.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 4</span>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-sm">List Job Posted</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (jobPost?.type === 'Internal') ? (
            <Card>
              <CardContent>
                <label htmlFor="internal">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-primary" /> 
                    <div>
                      <span className="text-xs font-bold">Internal Hire Only</span>
                      <p className="text-[10px] text-muted-foreground">Source from talent pool — no external posting</p>
                    </div>
                  </div>
                </label>
              </CardContent>
            </Card>
          ) : (
            <div>

            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="sm" onClick={() => navigate(`/sourcing/source-management`)}>
            Go to Source Management
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
