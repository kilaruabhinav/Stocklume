import { useEffect, useRef, useState } from "react";
import AutoComplete from "../../AutoComplete/AutoComplete";
import { searchTickers } from "../../../services/GetSearch/SearchTickerapi";
import "./CompareSymbolPicker.css";

function CompareSymbolPicker({ label, value, onChange, disabled }) {
  const [query, setQuery] = useState(value?.ticker || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const skippedSearchQueryRef = useRef("");

  const handleSelect = (suggestion) => {
    const selectedTicker = suggestion.displaySymbol || suggestion.symbol;

    skippedSearchQueryRef.current = selectedTicker;
    setQuery(selectedTicker);
    setSuggestions([]);
    setIsLoading(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange({
      ticker: selectedTicker,
      companyName: suggestion.description,
      finnhubSymbol: suggestion.finnhubSymbol || suggestion.symbol
    });
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;

    setQuery(nextValue);
    setIsOpen(Boolean(nextValue.trim()));
    setHighlightedIndex(-1);
    skippedSearchQueryRef.current = "";
    onChange({
      ticker: nextValue.trim().toUpperCase(),
      companyName: "",
      finnhubSymbol: ""
    });

    if (!nextValue.trim()) {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex >= suggestions.length - 1 ? 0 : currentIndex + 1
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1
      );
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || disabled) {
      return;
    }

    if (skippedSearchQueryRef.current === trimmedQuery) {
      return;
    }

    let isActive = true;

    const searchDelay = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchTickers(trimmedQuery);

      if (!isActive) return;

      setSuggestions(results);
      setIsLoading(false);
      setIsOpen(true);
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(searchDelay);
    };
  }, [query, disabled]);

  return (
    <div className="compare-picker">
      <label className="compare-picker__label">{label}</label>
      <div className="compare-picker__autocomplete">
        <input
          className="compare-picker__input"
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim() && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker"
          disabled={disabled}
          autoComplete="off"
        />
        <AutoComplete
          suggestions={suggestions}
          isOpen={isOpen}
          isLoading={isLoading}
          query={query}
          highlightedIndex={highlightedIndex}
          onSelect={handleSelect}
          onHighlight={setHighlightedIndex}
        />
      </div>
    </div>
  );
}

export default CompareSymbolPicker;
