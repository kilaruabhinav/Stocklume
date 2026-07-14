import { useEffect, useRef, useState } from "react";
import "./StockCard.css";

function StockCard({ stock, onDelete, setStock, selectedStock }) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (textRef.current && containerRef.current) {
            const hasOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
            setIsOverflowing(hasOverflow);
        }
    }, [stock.comp_name]);

    const formatPrice = (value) => {
        const number = Number(value);
        return Number.isFinite(number) ? `$${number.toFixed(2)}` : "N/A";
    };

    const formatChange = (change, percentChange) => {
        const changeNumber = Number(change);
        const percentNumber = Number(percentChange);

        if (!Number.isFinite(changeNumber) || !Number.isFinite(percentNumber)) {
            return "N/A";
        }

        return `${changeNumber < 0 ? "▼" : "▲"} ${Math.abs(changeNumber).toFixed(2)} (${Math.abs(percentNumber).toFixed(2)}%)`;
    };

    const isSelected = selectedStock && selectedStock.id === stock.id;
    const changeValue = Number(stock.change);
    const hasChange = Number.isFinite(changeValue);
    const isNegative = hasChange && changeValue < 0;
    const changeClass = !hasChange
        ? "stock-item-card__change--neutral"
        : isNegative
            ? "stock-item-card__change--negative"
            : "stock-item-card__change--positive";
    const changeTone = !hasChange
        ? "neutral"
        : isNegative
            ? "negative"
            : "positive";
    const companyName = stock.comp_name || stock.ticker;
    const handleSelect = () => setStock(stock);
    const handleCardKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={`stock-item-card stock-item-card--${changeTone} ${isSelected ? "is-selected" : ""}`}
            onClick={handleSelect}
            onKeyDown={handleCardKeyDown}
        >
            <span className="stock-item-card__accent" aria-hidden="true" />
            <div className="stock-item-card__info">
                <div className="stock-item-card__identity-row">
                    <span className="stock-item-card__ticker">{stock.ticker}</span>
                    {isSelected && <span className="stock-item-card__selected">Active</span>}
                </div>
                <div className="stock-item-card__name-container" ref={containerRef}>
                    <div className={`stock-item-card__marquee-track ${isOverflowing ? "is-animating" : ""}`}>
                        <h4 className="stock-item-card__name" ref={textRef}>
                            {companyName}
                        </h4>
                        {isOverflowing && (
                            <h4 className="stock-item-card__name stock-item-card__name--duplicate" aria-hidden="true">
                                {companyName}
                            </h4>
                        )}
                    </div>
                </div>
            </div>

            <div className="stock-item-card__actions">
                <div className="stock-item-card__market-data">
                    <span className="stock-item-card__price">{formatPrice(stock.price)}</span>
                    <span className={`stock-item-card__change ${changeClass}`}>
                        {formatChange(stock.change, stock.percentagechange)}
                    </span>
                </div>
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onDelete(stock.id);
                    }} 
                    className="stock-item-card__del-btn"
                    aria-label={`Remove ${stock.ticker} from watchlist`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default StockCard;
