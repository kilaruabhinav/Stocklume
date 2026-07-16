import { formatCurrency, formatPercent, getProfitLossClass } from "../utils/portfolioFormatters";
import PortfolioSummaryCard from "./PortfolioSummaryCard";
import "./PortfolioOverview.css";

function PortfolioOverview({ holdingsCount, pricesLoading, totals }) {
  const totalProfitLoss = pricesLoading
    ? "Loading..."
    : `${formatCurrency(totals.totalProfitLoss)} (${formatPercent(totals.totalProfitLossPercent)})`;

  return (
    <section className="portfolio-overview" aria-label="Account overview">
      <div className="portfolio-overview__title">Portfolio</div>
      <PortfolioSummaryCard
        label="Total Equity"
        value={pricesLoading ? "Loading..." : formatCurrency(totals.totalEquity)}
        tone="primary"
      />
      <PortfolioSummaryCard
        label="Total P/L"
        value={<span className={getProfitLossClass(totals.totalProfitLoss)}>{totalProfitLoss}</span>}
        tone="profitLoss"
      />
      <PortfolioSummaryCard label="Virtual Cash" value={formatCurrency(totals.cashBalance)} />
      <PortfolioSummaryCard
        label="Holdings Value"
        value={pricesLoading ? "Loading..." : formatCurrency(totals.holdingsValue)}
      />
      <PortfolioSummaryCard label="Total Invested" value={formatCurrency(totals.totalInvested)} />
      <PortfolioSummaryCard label="Holdings Count" value={holdingsCount} />
    </section>
  );
}

export default PortfolioOverview;
