import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssessmentPage(){
 // ── Phase ──
  const [phase, setPhase] = useState('start');        // 'start' | 'quiz' | 'done'
  const [error, setError] = useState(null);

  // ── Questions from DB ──
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]    = useState(true);

  // ── Participant form fields ──
  const [form, setForm] = useState({
    name: '', email: '', position: '',
    department: '', education: '', date_birth: '',
  });
  const [participantId, setParticipantId] = useState(null);

  // ── Quiz state ──
  const [currentIdx, setCurrentIdx]  = useState(0);
  const [answers, setAnswers]        = useState({});  // { [questionId]: selectedIndex }
  const [submitting, setSubmitting]  = useState(false);
  const [finalScore, setFinalScore]  = useState(null);

  const MAX_SCORE = QUESTIONS.reduce((sum, q) => sum + q.points, 0);
  console.log(MAX_SCORE)
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Complete the test to record your score.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current phase: {phase}</CardTitle>
          <CardDescription>
            This is a debug view — we'll replace it shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === 'start' && (
            <Button onClick={() => setPhase('quiz')}>
              Start Test
            </Button>
          )}
          {phase === 'quiz' && (
            <Button onClick={() => setPhase('done')}>
              Finish Test
            </Button>
          )}
          {phase === 'done' && (
            <Button onClick={() => setPhase('start')}>
              Restart
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}