import "./PortfolioEmptyState.css";

function PortfolioEmptyState({ children }) {
  return (
    <p className="portfolio-empty-state">
      {children}
    </p>
  );
}

export default PortfolioEmptyState;
