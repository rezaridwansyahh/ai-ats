import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

// Generic Advance/Hold/Reject-style decision widget — a toggle-button group
// with a confirm dialog per option, where `finalDecisions` lock the choice
// (further picks become disabled) and every other value stays reversible.
// Shared by the internal-battery decision flow (ScoreDecideTab's sidebar)
// and the External-battery decision flow — both just pass their own
// `options`/`confirmCopy`/vocabulary; this component owns no battery-specific
// behavior. `belowContent` is a slot for anything that should render below
// the options/hints — e.g. the internal flow's separate "Advance Stage" button.
export default function DecisionPanel({
  options, finalDecisions, confirmCopy, value, onConfirm, canEdit,
  holdValue, holdHint, belowContent,
}) {
  const locked = finalDecisions.includes(value);
  const [pendingVal, setPendingVal] = useState(null);
  const pendingOption = options.find((o) => o.val === pendingVal);

  const requestPick = (val) => {
    if (locked || !canEdit) return;
    if (val === value) return; // already this state, nothing to confirm
    setPendingVal(val);
  };

  const confirmPick = () => {
    if (pendingVal) onConfirm(pendingVal);
    setPendingVal(null);
  };

  return (
    <>
      <Card>
        <CardContent className="p-3 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Decision
          </p>

          <div className="space-y-1.5">
            {options.map((opt) => {
              const { val, label, cls, activeCls } = opt;
              const Icon = opt.icon;
              const active   = value === val;
              const disabled = !canEdit || (locked && !active);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => requestPick(val)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                    active ? activeCls : `${cls} hover:opacity-90`
                  } ${disabled && !active ? 'opacity-40 cursor-not-allowed hover:opacity-40' : ''} ${disabled && active ? 'cursor-default' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {active && <Check className="h-3 w-3 ml-auto" />}
                </button>
              );
            })}
          </div>

          {holdValue && value === holdValue && holdHint && (
            <p className="text-[10px] text-muted-foreground leading-snug">{holdHint}</p>
          )}
          {locked && (
            <p className="text-[10px] text-muted-foreground leading-snug">
              Decision recorded and locked.
            </p>
          )}

          {belowContent}
        </CardContent>
      </Card>

      <Dialog open={!!pendingVal} onOpenChange={(open) => !open && setPendingVal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm: {pendingOption?.label}?</DialogTitle>
            <DialogDescription>
              {pendingVal ? confirmCopy[pendingVal] : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingVal(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPick}>
              Confirm {pendingOption?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
