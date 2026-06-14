export default function RushTokenTracker({ count }) {
  return (
    <span className="rush-tracker" title={`${count} Rush tokens`}>
      <span className="rush-token">R</span>
      <strong>{count}</strong>
    </span>
  );
}
