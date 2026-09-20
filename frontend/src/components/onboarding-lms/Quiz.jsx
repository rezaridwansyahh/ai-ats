import { useState } from "react";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { LMS_DATA } from "./mockData";

export default function Quiz({moduleId, t, lang, goTo}){
  const { QUIZ } = LMS_DATA;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(QUIZ.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const q = QUIZ[step];
  const choices = lang === 'id' ? q.choices_id : q.choices_en;
  const isLast = step === QUIZ.length - 1;

  const select = (i) => {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
  };

  const correctCount = answers.filter((a, i) => a === QUIZ[i].correct).length;
  const score = Math.round((correctCount / QUIZ.length) * 100);
  const passed = score >= 70;

  if(submitted){
    return(
      <div className="max-w-2x1 mx-auto pb-12">
        <button
          onClick={() => goTo('module', {moduleId})}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t.quiz_back}
        </button>

        <div className="rounded-x1 border bg-card p-8 text-center mb-6">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold mb-4 ${
            passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {passed ? t.quiz_pass : t.quiz_fall}
          </div>
          <div className="font-serif text-4x1 font-bold mb-1">{score}%</div>
          <div className="text-sm text-muted-foreground mb-4">
            {t.quiz_score} · {t.quiz_correct} {correctCount}/{QUIZ.length}
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {passed ? t.quiz_pass_msg : t.quiz_fail.msg}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {QUIZ.map((question, i) => {
            const qText = lang === 'id' ? question.q_id : question.q_en;
            const wasCorrect = answers[i] === question.correct;
            return(
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3">
                {wasCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{qText}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-3">
          {passed ? (
            <Button onClick={() => goTo('feedback', { moduleId })}>{t.quiz_continue}</Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => { setAnswers(Array(QUIZ.length).fill(null)); setStep(0); setSubmitted(false); }}
            >
              {t.quiz_retake}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return(
     <div className="max-w-2xl mx-auto pb-12">
      <button
        onClick={() => goTo('module', { moduleId })}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t.quiz_back}
      </button>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {t.quiz_q} {step + 1} {t.quiz_of} {QUIZ.length}
        </span>
        <span className="text-xs text-muted-foreground">{t.quiz_threshold}</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
        <div
          className="h-full bg-emerald-600 transition-all"
          style={{ width: `${((step + 1) / QUIZ.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="font-serif text-lg font-semibold mb-5">
          {lang === 'id' ? q.q_id : q.q_en}
        </div>
        <div className="space-y-2">
          {choices.map((c, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                answers[step] === i
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'hover:bg-muted/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          {t.quiz_prev}
        </Button>
        {isLast ? (
          <Button disabled={answers[step] == null} onClick={() => setSubmitted(true)}>
            {t.quiz_submit}
          </Button>
        ) : (
          <Button disabled={answers[step] == null} onClick={() => setStep(step + 1)}>
            {t.quiz_next}
          </Button>
        )}
      </div>
    </div>
  );
}