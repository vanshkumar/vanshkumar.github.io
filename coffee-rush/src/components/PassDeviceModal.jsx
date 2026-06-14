export default function PassDeviceModal({ nextPlayerName, onContinue }) {
  if (!nextPlayerName) return null;

  return (
    <div className="modal-backdrop">
      <div className="pass-modal" role="dialog" aria-modal="true">
        <p>Pass device to</p>
        <h2>{nextPlayerName}</h2>
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
