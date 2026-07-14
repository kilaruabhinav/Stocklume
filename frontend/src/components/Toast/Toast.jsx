import "./Toast.css";

function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-message toast-message--${toast.type || "info"}`}
        >
          <div className="toast-message__content">
            <span className="toast-message__title">{toast.title}</span>
            {toast.message && (
              <span className="toast-message__body">{toast.message}</span>
            )}
          </div>
          <button
            type="button"
            className="toast-message__dismiss"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
