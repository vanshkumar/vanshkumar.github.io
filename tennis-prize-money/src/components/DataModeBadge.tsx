import type { DataMode } from '../data/dashboardDataset';

interface DataModeBadgeProps {
  mode: DataMode;
  label?: string;
}

const labels: Record<DataMode, string> = {
  real: 'Sourced data',
  mixed: 'Mixed data',
  mock: 'Mock/sample data',
};

export function DataModeBadge({ mode, label = labels[mode] }: DataModeBadgeProps) {
  return <span className={`data-mode-badge is-${mode}`}>{label}</span>;
}
