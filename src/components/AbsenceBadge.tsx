'use client';

import { format } from 'date-fns';
import { IconBeach, IconThermometer, IconPlane } from '@tabler/icons-react';

const TYPE_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  Holiday: {
    bg: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: <IconBeach size={14} />,
  },
  'Sick Leave': {
    bg: 'bg-red-50 text-red-600 border border-red-200',
    icon: <IconThermometer size={14} />,
  },
  Vacation: {
    bg: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: <IconPlane size={14} />,
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
      {style.icon}
      <span>{type}</span>
      <span className="opacity-75">{dateText}</span>
    </span>
  );
}
