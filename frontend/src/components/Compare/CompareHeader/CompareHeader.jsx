import { TIMEFRAME_OPTIONS } from "../compareUtils";
import "./CompareHeader.css";

function CompareHeader({ timeframe, onTimeframeChange }) {
  return (
    <header className="compare-header">
      <div>
        <span className="compare-eyebrow">Pair Analysis</span>
        <h1 className="compare-title">Compare Stocks</h1>
      </div>
      <div className="compare-timeframes" aria-label="Timeframe">
        {TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={`compare-timeframe-btn ${timeframe.label === option.label ? "is-active" : ""}`}
            onClick={() => onTimeframeChange(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </header>
  );
}

export default CompareHeader;
