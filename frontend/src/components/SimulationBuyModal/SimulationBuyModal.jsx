import { useEffect, useMemo, useRef, useState } from "react";
import { buySimulationStock, getSimulationAccount } from "../../services/Simulation/simulationApi";
import "./SimulationBuyModal.css";

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
}

function getAccountCashBalance(data) {
  return Number(data?.account?.cash_balance ?? data?.cash_balance);
}

function SimulationBuyModal({ stock, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashBalance, setCashBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const submitInFlightRef = useRef(false);

  const symbol = stock?.ticker || stock?.symbol || "";
  const companyName = stock?.comp_name || stock?.companyName || symbol;
  const price = Number(stock?.price);
  const quantityNumber = Number(quantity);
  const hasValidPrice = Number.isFinite(price) && price > 0;
  const hasValidQuantity = Number.isFinite(quantityNumber) && quantityNumber > 0;
  const hasKnownCashBalance = Number.isFinite(cashBalance);

  const estimatedCost = useMemo(() => {
    if (!hasValidPrice || !hasValidQuantity) {
      return null;
    }

    return quantityNumber * price;
  }, [hasValidPrice, hasValidQuantity, price, quantityNumber]);

  const maxQuantity = useMemo(() => {
    if (!hasValidPrice || !hasKnownCashBalance) {
      return 0;
    }

    return Math.floor(cashBalance / price);
  }, [cashBalance, hasKnownCashBalance, hasValidPrice, price]);

  const isOverCashBalance = hasKnownCashBalance && estimatedCost !== null && estimatedCost > cashBalance;
  const canUseMax = hasValidPrice && hasKnownCashBalance && maxQuantity > 0 && !isSubmitting;
  const isBuyDisabled = isSubmitting || isLoadingBalance || !hasValidPrice || !hasKnownCashBalance || isOverCashBalance;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setCashBalance(null);
        setBalanceError("");
        setIsLoadingBalance(true);
      }
    });

    getSimulationAccount()
      .then((data) => {
        if (!isActive) {
          return;
        }

        const nextCashBalance = getAccountCashBalance(data);

        if (!Number.isFinite(nextCashBalance)) {
          throw new Error("Could not load available cash.");
        }

        setCashBalance(nextCashBalance);
      })
      .catch(() => {
        if (isActive) {
          setCashBalance(null);
          setBalanceError("Could not load available cash.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingBalance(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isOpen]);

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

    if (submitInFlightRef.current) {
      return;
    }

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

    if (!hasKnownCashBalance) {
      setError("Could not load available cash.");
      return;
    }

    if (isOverCashBalance) {
      setError("Insufficient virtual cash for this estimated order.");
      return;
    }

    submitInFlightRef.current = true;
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
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleMaxClick() {
    if (canUseMax) {
      setQuantity(String(maxQuantity));
      setError("");
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
          <div className="simulation-buy-modal__summary-card simulation-buy-modal__summary-card--wide">
            <span>Available cash</span>
            <strong>
              {isLoadingBalance ? "Loading..." : hasKnownCashBalance ? formatCurrency(cashBalance) : "Unavailable"}
            </strong>
          </div>
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
          Final execution price is confirmed by the backend.
        </p>

        <label className="simulation-buy-modal__field">
          <span>Quantity</span>
          <div className="simulation-buy-modal__quantity-row">
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={isSubmitting}
            />
            <button
              className="simulation-buy-modal__max-button"
              type="button"
              onClick={handleMaxClick}
              disabled={!canUseMax}
            >
              Max
            </button>
          </div>
        </label>

        {balanceError && (
          <p className="simulation-buy-modal__message simulation-buy-modal__message--error">
            {balanceError}
          </p>
        )}

        {hasValidPrice && hasKnownCashBalance && maxQuantity === 0 && (
          <p className="simulation-buy-modal__message simulation-buy-modal__message--muted">
            Not enough cash for 1 share.
          </p>
        )}

        {isOverCashBalance && (
          <p className="simulation-buy-modal__message simulation-buy-modal__message--error">
            Insufficient virtual cash for this estimated order.
          </p>
        )}

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
            disabled={isBuyDisabled}
          >
            {isSubmitting ? "Buying..." : "Confirm Buy"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default SimulationBuyModal;
