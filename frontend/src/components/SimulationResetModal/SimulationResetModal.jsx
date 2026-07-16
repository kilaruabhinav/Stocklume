import "./SimulationResetModal.css";

function SimulationResetModal({
  error,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="simulation-reset-modal" role="dialog" aria-modal="true" aria-labelledby="simulation-reset-title">
      <button
        className="simulation-reset-modal__backdrop"
        type="button"
        aria-label="Close reset dialog"
        onClick={isSubmitting ? undefined : onClose}
      />

      <section className="simulation-reset-modal__panel">
        <header className="simulation-reset-modal__header">
          <div>
            <span>Danger Zone</span>
            <h2 id="simulation-reset-title">Reset Simulation</h2>
          </div>
          <button
            className="simulation-reset-modal__close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close reset dialog"
          >
            x
          </button>
        </header>

        <p className="simulation-reset-modal__warning">
          This will delete all virtual holdings and trade history and reset your cash balance to $100,000. This cannot be undone.
        </p>

        {error && (
          <p className="simulation-reset-modal__error">
            {error}
          </p>
        )}

        <footer className="simulation-reset-modal__actions">
          <button
            className="simulation-reset-modal__button simulation-reset-modal__button--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="simulation-reset-modal__button simulation-reset-modal__button--danger"
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset Simulation"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default SimulationResetModal;
