interface MockBadgeProps {
  label?: string;
}

export function MockBadge({ label = 'Mock/sample data' }: MockBadgeProps) {
  return <span className="mock-badge">{label}</span>;
}
