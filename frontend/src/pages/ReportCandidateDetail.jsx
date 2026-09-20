import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Loader2, AlertTriangle, ArrowLeft, MessageSquare, ArrowRight, MapPin, Save, Send, ChevronUp,
  Briefcase, FileText, Wand2, Workflow, Megaphone, Sparkles, Calendar as CalendarIcon, Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Pattern } from "@/components/report-candidate/report-stepper"
import ScreeningMain from "@/components/report-candidate/screening/screening-main"

import ParseDetails from '@/components/report-candidate/screening/parse-details';
import MatchDetails from '@/components/report-candidate/screening/match-details';
import QaDetails from '@/components/report-candidate/screening/qa-details';

import { getProgress, downloadCandidateCv } from '@/api/candidate.api';

export default function ReportCandidateDetailPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState('');
  const [stages, setStages] = useState([]);

  const [screeningData, setScreeningData] = useState('');

  const [activeStep, setActiveStep] = useState(0);
  const [activeSubStep, setActiveSubStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null); // null | 'not_found' | 'error'

  const fetchCandidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProgress(candidateId);
      setCandidate(res.data.candidate || '');
      setStages(res.data.stages || []);
      const screeningStep = res.data.stages?.find(
        stage => stage.category === "Screening & Matching"
      );
      
      if (screeningStep) {
        setScreeningData({
          parsedDone: screeningStep.process?.parse?.result,
          scoredDone: screeningStep.process?.match?.result,
          qaDone: screeningStep.process?.qa?.result
        });
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [candidateId]);
  
  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleClickSubStep = (num) => {
    setActiveSubStep(num);
  }

  const handleDownloadCv = async () => {
    if (!candidate?.applicant_id) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await downloadCandidateCv(candidate.applicant_id);
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${candidate?.name ?? 'candidate'}-cv.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError(err.response?.status === 404 ? 'not_found' : 'error');
    } finally {
      setDownloading(false);
    }
  };

  const parsedData = screeningData.parsedDone;
  const scoredData = screeningData.scoredDone;
  console.log(scoredData);
  const qaData = screeningData.qaDone;

  return (
    <>
      {/* Sticky header — lean, mirrors JobEdit's header. Posting + Re-sync live in the aside.
          -mt-5 -mx-5 px-5 cancels <main>'s p-5 so it pins flush under the breadcrumb. */}
      <div className="sticky top-[52px] z-10 bg-background/95 backdrop-blur-sm -mt-5 -mx-5 px-5 pt-5 pb-5 border-b border-border/60 space-y-3">
        {/* Action row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/report-candidate')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Jobs
          </Button>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] gap-6">
          <div className="space-y-4 min-w-0">
            <Card className="py-8 gap-3">
              <CardContent className="flex items-center justify-center">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Pattern 
                    candidate={candidate}
                    stages={stages}
                    activeStep={activeStep}
                    onActiveStepChange={setActiveStep}
                  />
                )}
              </CardContent>
            </Card>
            
            { activeStep === 1 &&
              <>
                {/* Engine Tiles */}
                <ScreeningMain 
                  screeningData = {screeningData}
                  onSubStepClick = {handleClickSubStep}
                  activeSubStep = {activeSubStep}
                />

                {/* Dynamic Sub-step Details */}
                {activeSubStep === 1 && <ParseDetails data={parsedData} />}
                {activeSubStep === 2 && <MatchDetails data={scoredData} />}
                {activeSubStep === 3 && <QaDetails data={qaData} />}
              </>
            }
            
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[143px] space-y-3">
              <Card className="py-4 gap-3">
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={downloading || !candidate?.applicant_id}
                    onClick={handleDownloadCv}
                  >
                    {downloading
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Downloading…</>
                      : <><Download className="h-3.5 w-3.5 mr-1.5" /> Download CV</>}
                  </Button>
                  {downloadError && (
                    <p className="text-[11px] text-destructive">
                      {downloadError === 'not_found' ? 'No CV available for this candidate.' : 'Failed to download CV.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}