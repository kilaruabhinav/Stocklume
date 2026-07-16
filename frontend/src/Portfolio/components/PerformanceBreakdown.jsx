import { calculatePerformanceBreakdown } from "../utils/portfolioCalculations";
import {
  formatCurrency,
  formatPercent,
  getProfitLossClass
} from "../utils/portfolioFormatters";
import "./PerformanceBreakdown.css";

function PerformanceBreakdown({ holdings, totals }) {
  const breakdown = calculatePerformanceBreakdown(holdings, totals);

  if (!breakdown) {
    return null;
  }

  return (
    <section className="portfolio-performance" aria-label="Performance breakdown">
      <header className="portfolio-performance__header">
        <h2>Performance Breakdown</h2>
      </header>
      <div className="portfolio-performance__grid">
        <article>
          <span>Best Performer</span>
          <strong>{breakdown.bestPerformer.symbol}</strong>
          <small className={getProfitLossClass(breakdown.bestPerformer.metrics.profitLoss)}>
            {formatPercent(breakdown.bestPerformer.metrics.profitLossPercent)}
          </small>
        </article>
        <article>
          <span>Worst Performer</span>
          <strong>{breakdown.worstPerformer.symbol}</strong>
          <small className={getProfitLossClass(breakdown.worstPerformer.metrics.profitLoss)}>
            {formatPercent(breakdown.worstPerformer.metrics.profitLossPercent)}
          </small>
        </article>
        <article>
          <span>Largest Holding</span>
          <strong>{breakdown.largestHolding.symbol}</strong>
          <small>{formatCurrency(breakdown.largestHolding.metrics.marketValue)}</small>
        </article>
        <article>
          <span>Cash Weight</span>
          <strong>{formatPercent(breakdown.cashWeight)}</strong>
          <small>of total equity</small>
        </article>
      </div>
    </section>
  );
}

export default PerformanceBreakdown;
