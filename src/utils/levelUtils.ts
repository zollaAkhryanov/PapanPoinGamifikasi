export interface LevelThreshold {
  level: number;
  title: string;
  minPoints: number;
  nextLevelPoints: number | null;
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, title: 'Perintis', minPoints: 0, nextLevelPoints: 500 },
  { level: 2, title: 'Eksplorasi', minPoints: 500, nextLevelPoints: 1000 },
  { level: 3, title: 'Praktisi', minPoints: 1000, nextLevelPoints: 1600 },
  { level: 4, title: 'Spesialis', minPoints: 1600, nextLevelPoints: 2300 },
  { level: 5, title: 'Mahir', minPoints: 2300, nextLevelPoints: 3100 },
  { level: 6, title: 'Pakar', minPoints: 3100, nextLevelPoints: null },
];

export interface ComputedLevelInfo {
  level: number;
  title: string;
  currentPoints: number;
  currentTierMin: number;
  nextTierPoints: number | null;
  pointsIntoLevel: number;
  pointsRequiredForTier: number;
  pointsToNextLevel: number;
  progressPercent: number;
}

export function calculateLevelInfo(totalPoints: number): ComputedLevelInfo {
  const safePoints = Math.max(0, Math.round(totalPoints));
  let matched = LEVEL_THRESHOLDS[0];

  for (const tier of LEVEL_THRESHOLDS) {
    if (safePoints >= tier.minPoints) {
      matched = tier;
    }
  }

  if (matched.nextLevelPoints === null) {
    return {
      level: matched.level,
      title: matched.title,
      currentPoints: safePoints,
      currentTierMin: matched.minPoints,
      nextTierPoints: null,
      pointsIntoLevel: safePoints - matched.minPoints,
      pointsRequiredForTier: 0,
      pointsToNextLevel: 0,
      progressPercent: 100,
    };
  }

  const tierSpan = matched.nextLevelPoints - matched.minPoints;
  const pointsIntoLevel = safePoints - matched.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round((pointsIntoLevel / tierSpan) * 100)));

  return {
    level: matched.level,
    title: matched.title,
    currentPoints: safePoints,
    currentTierMin: matched.minPoints,
    nextTierPoints: matched.nextLevelPoints,
    pointsIntoLevel,
    pointsRequiredForTier: tierSpan,
    pointsToNextLevel: Math.max(0, matched.nextLevelPoints - safePoints),
    progressPercent,
  };
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDateIndo(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatDateTimeIndo(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
