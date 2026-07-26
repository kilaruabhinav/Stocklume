import { useRef, useState } from "react";
import SimulationResetModal from "../components/SimulationResetModal/SimulationResetModal";
import SimulationSellModal from "../components/SimulationSellModal/SimulationSellModal";
import { resetSimulation } from "../services/Simulation/simulationApi";
import HoldingsTable from "./components/HoldingsTable";
import PerformanceBreakdown from "./components/PerformanceBreakdown";
import PortfolioOverview from "./components/PortfolioOverview";
import PortfolioStatusMessage from "./components/PortfolioStatusMessage";
import RecentTrades from "./components/RecentTrades";
import SimulationSettings from "./components/SimulationSettings";
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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const resetInFlightRef = useRef(false);

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

  async function handleResetSimulation() {
    if (resetInFlightRef.current) {
      return;
    }

    resetInFlightRef.current = true;
    setResetError("");
    setResetSubmitting(true);

    try {
      await resetSimulation();
      await refreshPortfolio({ showLoading: false });
      setSuccessMessage("Simulation reset successfully.");
      setIsResetModalOpen(false);
    } catch (resetRequestError) {
      setResetError(resetRequestError.message || "Could not reset simulation.");
    } finally {
      resetInFlightRef.current = false;
      setResetSubmitting(false);
    }
  }

  function openResetModal() {
    setSuccessMessage("");
    setResetError("");
    setIsResetModalOpen(true);
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
        <div className="portfolio-secondary-side">
          <PerformanceBreakdown holdings={enrichedHoldings} totals={totals} />
          <SimulationSettings onResetClick={openResetModal} />
        </div>
      </div>

      {selectedSellHolding && (
        <SimulationSellModal
          holding={selectedSellHolding}
          isOpen={Boolean(selectedSellHolding)}
          onClose={() => setSelectedSellHolding(null)}
          onSuccess={handleSellSuccess}
        />
      )}

      <SimulationResetModal
        error={resetError}
        isOpen={isResetModalOpen}
        isSubmitting={resetSubmitting}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetSimulation}
      />
    </main>
  );
}

export default Portfolio;
