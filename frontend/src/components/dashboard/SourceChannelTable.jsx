
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// TODO: replace with API call
const CHANNELS = [
  { name: 'LinkedIn',           apps: 312, screened: 198, interviewed: 67, hired: 18, conversion: 5.8  },
  { name: 'JobStreet',          apps: 456, screened: 245, interviewed: 52, hired: 14, conversion: 3.1  },
  { name: 'Employee Referrals', apps: 78,  screened: 65,  interviewed: 34, hired: 15, conversion: 19.2 },
  { name: 'Career Page',        apps: 234, screened: 156, interviewed: 28, hired: 8,  conversion: 3.4  },
  { name: 'Instagram / Social', apps: 189, screened: 89,  interviewed: 12, hired: 3,  conversion: 1.6  },
  { name: 'Kalibrr',            apps: 145, screened: 98,  interviewed: 22, hired: 6,  conversion: 4.1  },
];

// Derive quality from conversion rate instead of hardcoding it
function getQuality(conversion) {
  if (conversion >= 10) return 'High';
  if (conversion >= 3)  return 'Medium';
  return 'Low';
}

const qualityStyle = {
  High:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-red-50 text-red-600 border-red-200',
};

const COLUMNS = [
  { key: 'name',        label: 'Channel',      align: 'left'   },
  { key: 'apps',        label: 'Applications', align: 'center' },
  { key: 'screened',    label: 'Screened',     align: 'center' },
  { key: 'interviewed', label: 'Interviewed',  align: 'center' },
  { key: 'hired',       label: 'Hired',        align: 'center' },
  { key: 'conversion',  label: 'Conversion',   align: 'center' },
  { key: 'quality',     label: 'Avg. Quality', align: 'center', unsortable: true },
];

export default function SourceChannelTable() {
  const [sortKey, setSortKey]   = useState('conversion');
  const [sortDir, setSortDir]   = useState('desc');

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...CHANNELS].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    return sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Source Channel Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={`text-[10px] font-semibold uppercase tracking-wider ${col.align === 'center' ? 'text-center' : ''} ${!col.unsortable ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''}`}
                  onClick={() => !col.unsortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    {!col.unsortable && (
                      sortKey === col.key
                        ? sortDir === 'asc'
                          ? <ArrowUp className="h-3 w-3" />
                          : <ArrowDown className="h-3 w-3" />
                        : <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((ch) => {
              const quality = getQuality(ch.conversion);
              return (
                <TableRow key={ch.name}>
                  <TableCell className="font-medium text-xs">{ch.name}</TableCell>
                  <TableCell className="text-center text-xs">{ch.apps}</TableCell>
                  <TableCell className="text-center text-xs">{ch.screened}</TableCell>
                  <TableCell className="text-center text-xs">{ch.interviewed}</TableCell>
                  <TableCell className="text-center text-xs font-semibold">{ch.hired}</TableCell>
                  <TableCell className="text-center text-xs font-semibold">{ch.conversion.toFixed(1)}%</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-[10px] border ${qualityStyle[quality]}`}>
                      {quality}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}