import "./AnalizePanelES.css";

function AnalizePanelES() {
    return (
        <div className="analysis-empty-state">
            <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            </div>
            <h3>No Stock Selected</h3>
            <p>Select a stock from your watchlist to generate real-time metrics, interactive charts, and predictive technical analysis profiles.</p>
        </div>
        );
}


export default AnalizePanelES;
