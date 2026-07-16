import { useEffect, useMemo, useState } from "react";
import { sellSimulationStock } from "../../services/Simulation/simulationApi";
import { updateStock } from "../../services/GetStats/updatestockapi";
import "./SimulationSellModal.css";

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
}

function formatQuantity(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4
  }).format(number);
}

function SimulationSellModal({ holding, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const symbol = holding?.symbol || "";
  const ownedQuantity = Number(holding?.quantity);
  const quantityNumber = Number(quantity);
  const hasValidPrice = Number.isFinite(price) && price > 0;
  const hasValidOwnedQuantity = Number.isFinite(ownedQuantity) && ownedQuantity > 0;
  const hasValidQuantity =
    Number.isFinite(quantityNumber) &&
    quantityNumber > 0 &&
    hasValidOwnedQuantity &&
    quantityNumber <= ownedQuantity;

  const estimatedValue = useMemo(() => {
    if (!hasValidPrice || !hasValidQuantity) {
      return null;
    }

    return quantityNumber * price;
  }, [hasValidPrice, hasValidQuantity, price, quantityNumber]);

  useEffect(() => {
    if (!isOpen || !symbol) {
      return undefined;
    }

    let isActive = true;

    async function loadCurrentPrice() {
      setPriceLoading(true);
      setError("");
      setPrice(null);

      try {
        const latest = await updateStock(symbol);
        const latestPrice = Number(latest?.price);

        if (!isActive) {
          return;
        }

        if (!Number.isFinite(latestPrice) || latestPrice <= 0) {
          setError("Could not load estimated price. Please try again.");
          return;
        }

        setPrice(latestPrice);
      } catch {
        if (isActive) {
          setError("Could not load estimated price. Please try again.");
        }
      } finally {
        if (isActive) {
          setPriceLoading(false);
        }
      }
    }

    loadCurrentPrice();

    return () => {
      isActive = false;
    };
  }, [isOpen, symbol]);

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

  if (!isOpen || !holding) {
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
      setError("Could not load estimated price. Please try again.");
      return;
    }

    if (!hasValidQuantity) {
      setError("Quantity must be greater than 0 and no more than your owned quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend determines the final execution price.
      await sellSimulationStock({
        symbol,
        quantity: quantityNumber
      });

      await onSuccess?.({
        symbol,
        quantity: quantityNumber,
        price,
        totalValue: quantityNumber * price
      });
      onClose();
    } catch (sellError) {
      setError(sellError.message || "Could not complete the sell order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="simulation-sell-modal" role="dialog" aria-modal="true" aria-labelledby="simulation-sell-title">
      <button
        className="simulation-sell-modal-backdrop"
        type="button"
        aria-label="Close sell dialog"
        onClick={isSubmitting ? undefined : onClose}
      />

      <form className="simulation-sell-modal__panel" onSubmit={handleSubmit}>
        <header className="simulation-sell-modal__header">
          <div>
            <span className="simulation-sell-modal__ticker">{symbol}</span>
            <h2 id="simulation-sell-title">Sell virtual shares</h2>
            <p>Owned quantity: {formatQuantity(ownedQuantity)}</p>
          </div>

          <button
            className="simulation-sell-modal__close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close sell dialog"
          >
            x
          </button>
        </header>

        <div className="simulation-sell-modal__summary">
          <div className="simulation-sell-modal__price">
            <span>Estimated sell price</span>
            <strong>{priceLoading ? "Loading..." : formatCurrency(price)}</strong>
          </div>
          <div>
            <span>Estimated value</span>
            <strong>{estimatedValue === null ? "N/A" : formatCurrency(estimatedValue)}</strong>
          </div>
        </div>

        <p className="simulation-sell-modal__note">
          Final execution price is confirmed by backend.
        </p>

        <label className="simulation-sell-modal__field">
          <span>Quantity</span>
          <input
            type="number"
            min="0"
            max={hasValidOwnedQuantity ? ownedQuantity : undefined}
            step="any"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isSubmitting}
          />
        </label>

        {error && (
          <p className="simulation-sell-modal__error">
            {error}
          </p>
        )}

        <footer className="simulation-sell-modal__actions">
          <button
            className="simulation-sell-modal__button simulation-sell-modal__button--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="simulation-sell-modal__button simulation-sell-modal__button--primary"
            type="submit"
            disabled={isSubmitting || priceLoading || !hasValidPrice}
          >
            {isSubmitting ? "Selling..." : "Confirm Sell"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default SimulationSellModal;
