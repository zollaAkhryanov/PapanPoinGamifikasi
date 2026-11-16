import { ArrowUpRight, Award } from 'lucide-react';
import { formatPoints } from '../../utils/levelUtils';
import { Card, CardBody } from '../ui/Card';

interface PointsCardProps {
  totalPoints: number;
  weeklyDelta: number;
  rank: number | null;
  totalParticipants: number;
  completedModules: number;
  totalModules: number;
}

export function PointsCard({
  totalPoints,
  weeklyDelta,
  rank,
  totalParticipants,
  completedModules,
  totalModules,
}: PointsCardProps) {
  return (
    <Card>
      <CardBody className="flex flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Poin Kompetensi</p>
            <p className="mt-1.5 font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
              {formatPoints(totalPoints)}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <Award className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-500">Pekan Ini</p>
            <p className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              +{formatPoints(weeklyDelta)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Peringkat</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {rank ? `#${rank}` : '—'}
              {totalParticipants > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  {' '}/ {totalParticipants}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Modul Selesai</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {completedModules}/{totalModules}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
