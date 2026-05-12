'use client';

import { format } from 'date-fns';

const TYPE_STYLES: Record<string, { bg: string; emoji: string }> = {
  Holiday: {
    bg: 'bg-blue-50 text-blue-700 border border-blue-200',
    emoji: '\u{1F3D6}',
  },
  'Sick Leave': {
    bg: 'bg-red-50 text-red-600 border border-red-200',
    emoji: '\u{1F912}',
  },
  Vacation: {
    bg: 'bg-amber-50 text-amber-700 border border-amber-200',
    emoji: '✈️',
  },
};

function formatDate(d: string) {
  return format(new Date(d), 'dd.MM');
}

export function AbsenceBadge({
  type,
  dateFrom,
  dateTo,
}: {
  type: string;
  dateFrom: string;
  dateTo: string | null;
}) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.Holiday;
  const isRange = dateTo && dateTo !== dateFrom;

  const dateText = isRange
    ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
    : formatDate(dateFrom);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg}`}
    >
      <span>{style.emoji}</span>
      <span>{type}</span>
      <span className="opacity-75">{dateText}</span>
    </span>
  );
}
