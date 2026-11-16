import { calculateLevelInfo, formatPoints } from '../../utils/levelUtils';
import { Card, CardBody } from '../ui/Card';

interface LevelProgressBarProps {
  totalPoints: number;
  compact?: boolean;
}

export function LevelProgressBar({ totalPoints, compact = false }: LevelProgressBarProps) {
  const info = calculateLevelInfo(totalPoints);

  if (compact) {
    return (
      <div className="w-full min-w-[120px]">
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-slate-700 whitespace-nowrap">
            Lv. {info.level} · {info.title}
          </span>
          <span className="font-mono text-slate-500 tabular-nums">{info.progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={info.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progres Level ${info.level}`}
        >
          <div
            className="h-full rounded-full bg-blue-700 transition-all duration-300"
            style={{ width: `${info.progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col justify-between gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Tingkat & Progres Level</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                Level {info.level}
              </span>
              <span className="text-sm font-medium text-blue-700">· {info.title}</span>
            </div>
          </div>
          <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
            {info.progressPercent}%
          </span>
        </div>

        <div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={info.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres menuju level berikutnya ${info.progressPercent}%`}
          >
            <div
              className="h-full rounded-full bg-blue-700 transition-all duration-300"
              style={{ width: `${info.progressPercent}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-mono tabular-nums">
              {formatPoints(info.currentPoints)}{' '}
              {info.nextTierPoints !== null ? `/ ${formatPoints(info.nextTierPoints)} Poin` : 'Poin (Maksimal)'}
            </span>
            <span>
              {info.nextTierPoints !== null ? (
                <>
                  Butuh{' '}
                  <strong className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatPoints(info.pointsToNextLevel)} poin
                  </strong>{' '}
                  lagi ke Level {info.level + 1}
                </>
              ) : (
                'Seluruh jenjang level telah tercapai'
              )}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
