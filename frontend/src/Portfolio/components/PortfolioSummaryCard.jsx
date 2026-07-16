function PortfolioSummaryCard({ label, value, tone = "default" }) {
  const className =
    tone === "primary"
      ? "portfolio-card portfolio-card--primary"
      : tone === "profitLoss"
        ? "portfolio-card portfolio-card--profit-loss"
        : "portfolio-card";

  return (
    <article className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default PortfolioSummaryCard;
