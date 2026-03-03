import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const CHANNELS = [
  {
    name: 'LinkedIn',
    apps: 312,
    screened: 198,
    interviewed: 67,
    hired: 18,
    conversion: '5.8%',
    quality: 'High',
  },
  {
    name: 'JobStreet',
    apps: 456,
    screened: 245,
    interviewed: 52,
    hired: 14,
    conversion: '3.1%',
    quality: 'Medium',
  },
  {
    name: 'Employee Referrals',
    apps: 78,
    screened: 65,
    interviewed: 34,
    hired: 15,
    conversion: '19.2%',
    quality: 'High',
  },
  {
    name: 'Career Page',
    apps: 234,
    screened: 156,
    interviewed: 28,
    hired: 8,
    conversion: '3.4%',
    quality: 'Medium',
  },
  {
    name: 'Instagram / Social',
    apps: 189,
    screened: 89,
    interviewed: 12,
    hired: 3,
    conversion: '1.6%',
    quality: 'Low',
  },
  {
    name: 'Kalibrr',
    apps: 145,
    screened: 98,
    interviewed: 22,
    hired: 6,
    conversion: '4.1%',
    quality: 'Medium',
  },
];

const qualityVariant = {
  High: 'default',
  Medium: 'secondary',
  Low: 'outline',
};

export default function SourceChannelTable() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Source Channel Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Channel</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Applications</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Screened</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Interviewed</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Hired</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Conversion</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Avg. Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHANNELS.map((ch) => (
              <TableRow key={ch.name}>
                <TableCell className="font-medium text-xs">{ch.name}</TableCell>
                <TableCell className="text-center text-xs">{ch.apps}</TableCell>
                <TableCell className="text-center text-xs">{ch.screened}</TableCell>
                <TableCell className="text-center text-xs">{ch.interviewed}</TableCell>
                <TableCell className="text-center text-xs font-semibold">{ch.hired}</TableCell>
                <TableCell className="text-center text-xs font-semibold">{ch.conversion}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={qualityVariant[ch.quality]} className="text-[10px]">
                    {ch.quality}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
