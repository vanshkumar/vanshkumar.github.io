import type { KpiMetric } from '../lib/dashboardMetrics';

interface KpiCardProps {
  metric: KpiMetric;
}

export function KpiCard({ metric }: KpiCardProps) {
  return (
    <article className={metric.unavailable ? 'kpi-card is-muted' : 'kpi-card'}>
      <span>{metric.eyebrow}</span>
      <h3>{metric.label}</h3>
      <strong>{metric.value}</strong>
      <p>{metric.note}</p>
    </article>
  );
}
