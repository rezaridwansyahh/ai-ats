// Shared Joyride theme config, split by interaction model:
//
// CLICK_THROUGH_* — user advances via Next/Back buttons.
//   Used by: PipelineTour.jsx, EndToEndTour.jsx
//
// ACTION_GATED_* — no Next button; steps advance automatically once
//   `isDone(ctx)` is true (user actually did the thing).
//   Used by: FirstJobWizard.jsx, CvUploadWizard.jsx
//
// Keeping these as two separate exports (not one merged object) because
// the two interaction models genuinely have different `buttons` and
// `hideFooter` needs — merging them would just reintroduce per-file
// overrides at the call site.

export const CLICK_THROUGH_OPTIONS = {
  showProgress: true,
  buttons: ['skip', 'back', 'primary'],
  overlayClickAction: 'close',
  scrollOffset: 100, // accounts for sticky top headers so targets don't scroll underneath them
  primaryColor: '#0f766e',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  arrowColor: '#ffffff',
  overlayColor: 'rgba(15, 23, 42, 0.55)',
  zIndex: 9999,
};

export const CLICK_THROUGH_STYLES = {
  tooltip: { borderRadius: 12, fontSize: 13, padding: 16 },
  tooltipTitle: { fontSize: 14, fontWeight: 700 },
  buttonPrimary: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    fontSize: 12,
    padding: '8px 14px',
    outline: 'none',
  },
  buttonBack: { fontSize: 12, color: '#6b7280', outline: 'none' },
  buttonSkip: { fontSize: 12, color: '#6b7280', outline: 'none' },
};

export const ACTION_GATED_OPTIONS = {
  showProgress: true,
  buttons: ['skip'],
  overlayClickAction: 'close',
  scrollOffset: 100,
  primaryColor: '#0f766e',
  textColor: '#1f2937',
  backgroundColor: '#ffffff',
  arrowColor: '#ffffff',
  overlayColor: 'rgba(15, 23, 42, 0.45)',
  zIndex: 9999,
};

export const ACTION_GATED_STYLES = {
  tooltip: { borderRadius: 12, fontSize: 13, padding: 16 },
  tooltipTitle: { fontSize: 14, fontWeight: 700 },
  buttonSkip: { fontSize: 12, color: '#6b7280', outline: 'none' },
};