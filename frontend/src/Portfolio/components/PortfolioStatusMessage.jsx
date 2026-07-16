import "./PortfolioStatusMessage.css";

function PortfolioStatusMessage({ children, tone = "default" }) {
  const toneClass =
    tone === "error"
      ? "portfolio-state--error"
      : tone === "success"
        ? "portfolio-success"
        : tone === "price"
          ? "portfolio-price-state"
          : tone === "warning"
            ? "portfolio-price-state portfolio-price-state--warning"
            : "portfolio-state";

  return (
    <section className={toneClass} aria-live="polite">
      {children}
    </section>
  );
}

export default PortfolioStatusMessage;
