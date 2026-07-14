import Watchlist from "../Watchlist/Watchlist";
import StockForm from "../StockForm";
import Insights from "../Insights/Insights";
import "./LeftPanel.css"
function LeftPanel({getData, loading, watchlistLoading, stocks, DeleteStock, handleSelectStock, selectedStock, chartData, timeframe, chartLoading}){
    return (
        <div className="left-panel">
            <aside className="sidebar-container">
                <StockForm onSubmit={getData} loading={loading} />
      
                <div className="sidebar-divider" />
      
                    {/* Classic Section Header inside the Left Panel Card */}
                    <div className="sidebar-section-header">
                        <h2>Watchlist</h2>
                        <span className="stock-count">{stocks.length} Assets</span>
                    </div>
      
                <Watchlist
                    loading={watchlistLoading}
                    stockDelete={DeleteStock}
                    stocks={stocks}
                    setss={handleSelectStock}
                    diffsel={selectedStock}
                />
            </aside>
            {selectedStock && (
                <div className="left-panel__insights">
                    <Insights
                        chartData={chartData}
                        timeframe={timeframe}
                        selectedstock={selectedStock}
                        loading={chartLoading}
                    />
                </div>
            )}
        </div>
    );
}

export default LeftPanel;
