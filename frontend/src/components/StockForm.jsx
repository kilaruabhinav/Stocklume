import { useEffect, useRef, useState } from "react";
import AutoComplete from "./AutoComplete/AutoComplete";
import { searchTickers } from "../services/GetSearch/SearchTickerapi";
import "./StockForm.css";

function StockForm({ onSubmit, loading }) {
    const [tic, setTic] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const skippedSearchQueryRef = useRef("");

    const handleChange = (e) => {
        const nextValue = e.target.value;

        setTic(nextValue);
        setIsDropdownOpen(Boolean(nextValue.trim()));
        setHighlightedIndex(-1);
        setSelectedSuggestion(null);
        skippedSearchQueryRef.current = "";

        if (!nextValue.trim()) {
            setSuggestions([]);
            setSearchLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        const selectedTicker = suggestion.displaySymbol || suggestion.symbol;

        skippedSearchQueryRef.current = selectedTicker;
        setTic(selectedTicker);
        setSelectedSuggestion(suggestion);
        setSuggestions([]);
        setSearchLoading(false);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isDropdownOpen || suggestions.length === 0) {
            if (e.key === "Escape") {
                setIsDropdownOpen(false);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((currentIndex) =>
                currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1
            );
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((currentIndex) =>
                currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1
            );
        }

        if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[highlightedIndex]);
        }

        if (e.key === "Escape") {
            setIsDropdownOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!tic.trim() || loading) return; // Prevent empty submissions or multiple clicks while loading
        
        onSubmit({
            ticker: tic,
            companyName:
                (selectedSuggestion?.displaySymbol === tic.trim() ||
                    selectedSuggestion?.symbol === tic.trim())
                    ? selectedSuggestion.description
                    : "",
            finnhubSymbol: selectedSuggestion?.finnhubSymbol || ""
        });
        setTic("");  
        setSelectedSuggestion(null);
        skippedSearchQueryRef.current = "";
        setSuggestions([]);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
    };

    useEffect(() => {
        const query = tic.trim();

        if (!query || loading) {
            return;
        }

        if (skippedSearchQueryRef.current === query) {
            return;
        }

        let isActive = true;

        const searchDelay = setTimeout(async () => {
            setSearchLoading(true);
            const results = await searchTickers(query);

            if (!isActive) return;

            setSuggestions(results);
            setSearchLoading(false);
            setIsDropdownOpen(true);
        }, 250);

        return () => {
            isActive = false;
            clearTimeout(searchDelay);
        };
    }, [tic, loading]);
    
    return (
        <form onSubmit={handleSubmit} className="ticker-card">
            <div className="ticker-card__header">
                <div>
                    <h3 className="ticker-card__title">Track Asset</h3>
                    <span className="ticker-card__subtitle">Stocks, ETFs, and crypto</span>
                </div>
                <span className="ticker-card__badge">Live</span>
            </div>

            <div className="ticker-card__field">
                <label className="ticker-card__label">Ticker</label>
                <div className="ticker-card__autocomplete">
                    <div className="ticker-card__input-shell">
                        <span className="ticker-card__prefix">$</span>
                        <input 
                            type="text" 
                            className="ticker-card__input" 
                            value={tic} 
                            onChange={handleChange}
                            onFocus={() => {
                                if (tic.trim() && suggestions.length > 0) {
                                    setIsDropdownOpen(true);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => setIsDropdownOpen(false), 120);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="AAPL"
                            disabled={loading}
                            autoComplete="off"
                        />
                    </div>
                    <AutoComplete
                        suggestions={suggestions}
                        isOpen={isDropdownOpen}
                        isLoading={searchLoading}
                        query={tic}
                        highlightedIndex={highlightedIndex}
                        onSelect={handleSelectSuggestion}
                        onHighlight={setHighlightedIndex}
                    />
                </div>
            </div>
            <div className="ticker-card__actions">
                <button 
                    type="submit" 
                    className={`ticker-card__btn ${loading ? "ticker-card__btn--loading" : ""}`}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="ticker-card__spinner"></div>
                    ) : (
                        <>
                            <span>Add Ticker</span>
                            <span className="ticker-card__btn-icon" aria-hidden="true">+</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default StockForm;
