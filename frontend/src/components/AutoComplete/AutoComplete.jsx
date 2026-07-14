import "./AutoComplete.css";
import AutoCompleteEle from "./AutoCompleteEle/AutoCompleteEle";

function AutoComplete({
  suggestions,
  isOpen,
  isLoading,
  query,
  highlightedIndex,
  onSelect,
  onHighlight
}) {
  if (!isOpen) return null;

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="autocomplete-menu" role="listbox">
      {isLoading ? (
        <div className="autocomplete-status">Searching tickers...</div>
      ) : hasSuggestions ? (
        suggestions.map((suggestion, index) => (
          <AutoCompleteEle
            key={`${suggestion.symbol}-${index}`}
            suggestion={suggestion}
            isActive={index === highlightedIndex}
            onSelect={onSelect}
            onHighlight={() => onHighlight(index)}
          />
        ))
      ) : query.trim() ? (
        <div className="autocomplete-status">No matches found</div>
      ) : null}
    </div>
  );
}

export default AutoComplete;
