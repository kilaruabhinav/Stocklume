import { useEffect, useMemo, useState } from "react";
import { buySimulationStock } from "../../services/Simulation/simulationApi";
import "./SimulationBuyModal.css";

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
}

function SimulationBuyModal({ stock, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const symbol = stock?.ticker || stock?.symbol || "";
  const companyName = stock?.comp_name || stock?.companyName || symbol;
  const price = Number(stock?.price);
  const quantityNumber = Number(quantity);
  const hasValidPrice = Number.isFinite(price) && price > 0;
  const hasValidQuantity = Number.isFinite(quantityNumber) && quantityNumber > 0;

  const estimatedCost = useMemo(() => {
    if (!hasValidPrice || !hasValidQuantity) {
      return null;
    }

    return quantityNumber * price;
  }, [hasValidPrice, hasValidQuantity, price, quantityNumber]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !stock) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!symbol) {
      setError("Symbol is missing.");
      return;
    }

    if (!hasValidPrice) {
      setError("Estimated price is unavailable. Refresh the stock quote and try again.");
      return;
    }

    if (!hasValidQuantity) {
      setError("Quantity must be a number greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend determines the final execution price.
      await buySimulationStock({
        symbol,
        quantity: quantityNumber
      });

      onSuccess?.({
        symbol,
        quantity: quantityNumber,
        price,
        totalValue: quantityNumber * price
      });
      onClose();
    } catch (buyError) {
      setError(buyError.message || "Could not complete the buy order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="simulation-buy-modal" role="dialog" aria-modal="true" aria-labelledby="simulation-buy-title">
      <button
        className="simulation-buy-modal__backdrop"
        type="button"
        aria-label="Close buy dialog"
        onClick={isSubmitting ? undefined : onClose}
      />

      <form className="simulation-buy-modal__panel" onSubmit={handleSubmit}>
        <header className="simulation-buy-modal__header">
          <div>
            <span className="simulation-buy-modal__ticker">{symbol}</span>
            <h2 id="simulation-buy-title">Buy with virtual money</h2>
            <p>{companyName}</p>
          </div>

          <button
            className="simulation-buy-modal__close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close buy dialog"
          >
            x
          </button>
        </header>

        <div className="simulation-buy-modal__summary">
          <div>
            <span>Estimated price</span>
            <strong>{formatCurrency(price)}</strong>
          </div>
          <div>
            <span>Estimated cost</span>
            <strong>{estimatedCost === null ? "N/A" : formatCurrency(estimatedCost)}</strong>
          </div>
        </div>

        <p className="simulation-buy-modal__note">
          Final execution price is confirmed by backend.
        </p>

        <label className="simulation-buy-modal__field">
          <span>Quantity</span>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isSubmitting}
          />
        </label>

        {error && (
          <p className="simulation-buy-modal__message simulation-buy-modal__message--error">
            {error}
          </p>
        )}

        <footer className="simulation-buy-modal__actions">
          <button
            className="simulation-buy-modal__button simulation-buy-modal__button--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="simulation-buy-modal__button simulation-buy-modal__button--primary"
            type="submit"
            disabled={isSubmitting || !hasValidPrice}
          >
            {isSubmitting ? "Buying..." : "Confirm Buy"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default SimulationBuyModal;
