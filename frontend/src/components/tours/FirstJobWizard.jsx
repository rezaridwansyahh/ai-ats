import { useEffect, useRef, useState, useCallback } from "react";
import { Joyride, STATUS } from "react-joyride";
import { Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";

/**
 * FirstJobWizard
 * -------------------------------------------------------------------------
 * Action-based guided setup for JobEditPage — DIFFERENT from PipelineTour.
 *
 * PipelineTour = "look here, now look here" explainer, advances on a Next click.
 * FirstJobWizard = advances automatically the moment the user actually DOES
 * the real thing (types a title, fills required fields, publishes) — no
 * Next button on these steps at all. Each step's `isDone(ctx)` checks REAL
 * form/job state passed in from JobEditPage, not a click event.
 *
 * Unlike the first version, this does NOT auto-launch silently. It shows an
 * opt-in prompt card first ("Start guided setup" / "No thanks, I'll explore
 * myself") so someone who prefers to figure the form out on their own can
 * dismiss it in one click and never see it again, instead of the wizard
 * forcing a locked-step walkthrough on everyone by default.
 *
 * Must be rendered INSIDE JobEditPage (not standalone like PipelineTour),
 * since it needs live access to `form`, `job`, `hasStages`, etc. to know
 * when a step has actually been completed.
 */

const STORAGE_KEY = 'myralix.tour.seen.first-job-wizard';

const STEPS = [
    {
        target: '[data-wizard="job-title"]',
        title: "Let's create your first job",
        content: 'Start by typing a job title. We\u2019ll save your draft automatically as you go.',
        placement: 'bottom',
        isDone: (ctx) => !!ctx.form?.job_title?.trim(),
    },
    {
        target: '[data-wizards="basics-card"]',
        title: 'Fill in the basics',
        content: 'Company, location, work type, seniority, and pay range \u2014 fill these in below. We\u2019ll move on automatically once they\u2019re all set.',
        placement: 'right',
        onEnter: (helpers) => helpers.setStep(0),
        isDone: (ctx) => ctx.missingRequiredBasics.length === 0 && ctx.invalidUrlFields.length === 0,
    },
    {
        target: '[data-wizards="jd-card"]',
        title: 'Describe the role',
        content: 'Write a short summary, list responsibilities, and add at least one required skill. Try AI Generate for a head start.',
        placement: 'right',
        onEnter: (helpers)
    }
]