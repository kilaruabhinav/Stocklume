import "./AutoCompleteEle.css";

function AutoCompleteEle({ suggestion, isActive, onSelect, onHighlight }) {
  if (!suggestion) return null;

  return (
    <button
      type="button"
      className={`autocomplete-option ${isActive ? "is-active" : ""}`}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(suggestion);
      }}
      onMouseEnter={onHighlight}
    >
      <span className="autocomplete-option__symbol">
        {suggestion.displaySymbol}
      </span>
      <span className="autocomplete-option__meta">
        <span className="autocomplete-option__description">
          {suggestion.description}
        </span>
        <span className="autocomplete-option__type">
          {suggestion.type}
        </span>
      </span>
    </button>
  );
}

export default AutoCompleteEle;
