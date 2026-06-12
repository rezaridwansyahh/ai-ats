// components/ScoreItem.jsx
import { Progress } from "@/components/ui/progress";

export function ScoreItem({ label, score }) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={`font-mono ${getScoreColor()}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}