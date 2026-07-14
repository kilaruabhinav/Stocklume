import "./LoaderStats.css";

function LoaderStats() {
    return (
        <div className="statistics-container responsive-horizontal UI-loading">
            <div className="statistics-header">
                <div>
                    <span className="statistics-eyebrow skeleton-shimmer skeleton-pill"></span>
                    <h2 className="statistics-heading">Statistics</h2>
                    <span className="statistics-subtitle skeleton-shimmer skeleton-subtitle"></span>
                </div>
                <span className="statistics-timeframe skeleton-shimmer skeleton-timeframe"></span>
            </div>
            <div className="stats-highlight-grid">
                {[...Array(4)].map((_, index) => (
                    <div className="stats-item stats-item--featured skeleton-item" key={`featured-${index}`}>
                        <span className="stats-label skeleton-shimmer skeleton-text-short"></span>
                        <span className="stats-value skeleton-shimmer skeleton-text-long"></span>
                        <span className="stats-detail skeleton-shimmer skeleton-text-mini"></span>
                    </div>
                ))}
            </div>
            <div className="stats-section-label skeleton-shimmer skeleton-section-label"></div>
            <div className="stats-responsive-grid">
                {[...Array(10)].map((_, index) => (
                    <div className="stats-item skeleton-item" key={index}>
                        <span className="stats-label skeleton-shimmer skeleton-text-short"></span>
                        <span className="stats-value skeleton-shimmer skeleton-text-long"></span>
                        <span className="stats-detail skeleton-shimmer skeleton-text-mini"></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LoaderStats;
