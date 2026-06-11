import { useEffect, useCallback, useMemo, useState } from 'react';
import { cn } from "@/lib/utils";  // Common in shadcn projects

import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper"
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { Badge } from "@/components/reui/badge"

export function Pattern({ candidate, stages, activeStep, onActiveStepChange }) {
  const defaultStep = stages?.findIndex(stage => stage.stage_id === candidate?.latest_stage) + 1 ?? 0;

  // Fix: Update activeStep when data loads
  useEffect(() => {
    const calculatedStep = stages?.findIndex(stage => stage.stage_id === candidate?.latest_stage) + 1 ?? 0;
    if (calculatedStep !== -1 && calculatedStep !== activeStep) {
      onActiveStepChange(calculatedStep);
    }
  }, [stages, candidate]);

  const handleStepClick = (stepNumber) => {
    console.log(`Clicked step ${stepNumber}`);
    onActiveStepChange(stepNumber);
    // Don't auto-complete, just change active step
  };

  return (
    <Stepper
      key={activeStep}
      value={activeStep}
      onValueChange={onActiveStepChange}
      indicators={{
        completed: (
          <CheckIcon  className="size-3.5" />
        ),
        loading: (
          <LoaderCircleIcon  className="size-3.5 animate-spin" />
        ),
      }}
      className="w-full space-y-8"
    >
      <StepperNav>
        {stages.map((stage, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeStep;
          const isDisabled = stages.find(s => s.stage_id === candidate.latest_stage).stage_order < stage.stage_order

          return (
            <StepperItem key={index} step={index + 1} className="relative">
              <div 
                className={cn(
                  "flex flex-col",
                  isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )} 
                onClick={() => !isDisabled && handleStepClick(index + 1)}
                >
                <div className="flex justify-start gap-1.5">
                  <div className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                    isActive 
                      ? "bg-primary text-primary-foreground"  // Active - highlighted
                      : "bg-accent text-accent-foreground"    // Inactive - gray
                  )}>
                    {stepNumber}
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <StepperTitle>{stage.stage_name}</StepperTitle>
                    <StepperDescription>{stage.category}</StepperDescription>
                  </div>
                </div>
                
                <div>
                  {candidate.latest_stage === stage.stage_id 
                  ? <Badge
                    size="sm"
                    variant="primary-light"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    In Progress
                  </Badge>
                  : stages.find(s => s.stage_id === candidate.latest_stage).stage_order > stage.stage_order ?
                    <Badge
                    variant="success-light"
                    size="sm"
                  >
                    Completed
                  </Badge>
                  :
                    <Badge
                    variant="secondary"
                    size="sm"
                  >
                    Pending
                  </Badge>
                  }

                </div>
              </div>
              {stages.length > index + 1 && (
                <StepperSeparator className="md:mx-2.5" />
              )}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Stepper>
  )
}