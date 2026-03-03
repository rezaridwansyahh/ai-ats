import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Monitor, Phone } from 'lucide-react';

const INTERVIEWS = [
  {
    initials: 'DS',
    name: 'Dewi Sartika',
    role: 'Sr. Frontend Developer',
    platform: 'Zoom',
    date: 'Today, 14:00',
    bg: 'bg-primary',
  },
  {
    initials: 'BP',
    name: 'Budi Prasetyo',
    role: 'Full Stack Developer',
    platform: 'Google Meet',
    date: 'Today, 16:30',
    bg: 'bg-amber-500',
  },
  {
    initials: 'RK',
    name: 'Rina Kartika',
    role: 'UI/UX Designer',
    platform: 'MS Teams',
    date: 'Tomorrow, 10:00',
    bg: 'bg-blue-500',
  },
];

const platformIcon = {
  Zoom: Video,
  'Google Meet': Monitor,
  'MS Teams': Phone,
};

export default function UpcomingInterviews() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Upcoming Interviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {INTERVIEWS.map((item) => {
          const PlatformIcon = platformIcon[item.platform] || Video;
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border-l-3 border-primary"
            >
              <div
                className={`w-9 h-9 rounded-full ${item.bg} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}
              >
                {item.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.role}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <PlatformIcon className="h-3 w-3" />
                  {item.platform}
                </div>
                <p className="text-[11px] font-medium">{item.date}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
