import { cn } from '../../lib/utils';
import { DifficultyColors } from '../../types/api';

interface BadgeProps {
  label: string;
  className?: string;
}

export function DifficultyBadge({ label, className }: BadgeProps) {
  const colorClass = DifficultyColors[label] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {label}
    </span>
  );
}
