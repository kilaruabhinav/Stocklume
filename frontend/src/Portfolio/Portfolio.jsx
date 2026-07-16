import { useState } from "react";
import SimulationSellModal from "../components/SimulationSellModal/SimulationSellModal";
import HoldingsTable from "./components/HoldingsTable";
import PerformanceBreakdown from "./components/PerformanceBreakdown";
import PortfolioOverview from "./components/PortfolioOverview";
import PortfolioStatusMessage from "./components/PortfolioStatusMessage";
import RecentTrades from "./components/RecentTrades";
import { usePortfolioData } from "./hooks/usePortfolioData";
import { formatCurrency, formatQuantity } from "./utils/portfolioFormatters";
import "./Portfolio.css";

function Portfolio() {
  const {
    holdings,
    enrichedHoldings,
    trades,
    totals,
    loading,
    error,
    pricesLoading,
    pricesError,
    refreshPortfolio
  } = usePortfolioData();
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedSellHolding, setSelectedSellHolding] = useState(null);

  async function handleSellSuccess({ symbol, quantity, totalValue }) {
    await refreshPortfolio({ showLoading: false });
    setSuccessMessage(
      `Sold ${formatQuantity(quantity)} ${symbol} for ${formatCurrency(totalValue)}.`
    );
  }

  function openSellModal(holding) {
    setSuccessMessage("");
    setSelectedSellHolding(holding);
  }

  if (loading) {
    return (
      <main className="portfolio-page">
        <PortfolioStatusMessage>
          Loading portfolio...
        </PortfolioStatusMessage>
      </main>
    );
  }

  if (error) {
    return (
      <main className="portfolio-page">
        <PortfolioStatusMessage tone="error">
          {error}
        </PortfolioStatusMessage>
      </main>
    );
  }

  return (
    <main className="portfolio-page">
      <PortfolioOverview
        holdingsCount={holdings.length}
        pricesLoading={pricesLoading}
        totals={totals}
      />

      {successMessage && (
        <PortfolioStatusMessage tone="success">
          {successMessage}
        </PortfolioStatusMessage>
      )}

      {pricesLoading && holdings.length > 0 && (
        <PortfolioStatusMessage tone="price">
          Refreshing current market prices...
        </PortfolioStatusMessage>
      )}

      {pricesError && !pricesLoading && (
        <PortfolioStatusMessage tone="warning">
          {pricesError}
        </PortfolioStatusMessage>
      )}

      <HoldingsTable
        holdings={enrichedHoldings}
        pricesLoading={pricesLoading}
        onSellClick={openSellModal}
      />

      <div className="portfolio-secondary-grid">
        <RecentTrades trades={trades} />
        <PerformanceBreakdown holdings={enrichedHoldings} totals={totals} />
      </div>

      {selectedSellHolding && (
        <SimulationSellModal
          holding={selectedSellHolding}
          isOpen={Boolean(selectedSellHolding)}
          onClose={() => setSelectedSellHolding(null)}
          onSuccess={handleSellSuccess}
        />
      )}
    </main>
  );
}

export default Portfolio;
