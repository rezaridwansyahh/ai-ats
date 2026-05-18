import CandidateCard from '@/components/assessment-a/CandidateCard';

export default function AssessmentAPage() {
  // allowViewReport prop controls whether "Lihat Laporan Hasil" button is shown
  // Set to false to hide the button (useful for future restrictions)
  return <CandidateCard allowViewReport={true} />;
}
