import StockCard from "../StockCard";
import "./Watchlist.css";

function Watchlist({ stocks, stockDelete, setss, diffsel, loading}) {
    if (loading) {
        return (
            <div className="watchlist-scroll-container watchlist-scroll-container--loading" aria-label="Loading watchlist">
                {[1, 2, 3, 4].map((item) => (
                    <div className="watchlist-skeleton" key={item}>
                        <span className="watchlist-skeleton__ticker" />
                        <span className="watchlist-skeleton__name" />
                        <span className="watchlist-skeleton__price" />
                    </div>
                ))}
            </div>
        );
    }

    if (stocks.length === 0) {
        return (
            <div className="watchlist-scroll-container">
                <div className="stock-empty-state">
                    <div className="stock-empty-state__icon" aria-hidden="true">+</div>
                    <p className="stock-empty-state__text">No Stocks Added Yet</p>
                    <span className="stock-empty-state__hint">Add a ticker above to start tracking price moves.</span>
                </div>
            </div>
        );
    }

    const shouldScroll = stocks.length >= 5;
    const containerClassName = shouldScroll
        ? "watchlist-scroll-container watchlist-scroll-container--scrollable"
        : "watchlist-scroll-container";

    return (
        <div className={containerClassName}>
            {stocks.map((stock) => (
                <StockCard stock={stock} onDelete={stockDelete} key={stock.id} setStock={setss} selectedStock={diffsel}/>
            ))}
        </div>
    );
}

export default Watchlist;
