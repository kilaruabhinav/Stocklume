import { useState } from "react";
import "./HBMW.css";

function HBMW({ selectedstock, onTimeframeChange}) {
  const [activeTimeframe, setActiveTimeframe] = useState("1M");
  const timeframes = ["1M", "3M", "6M", "1Y"];

  const handleTimeframeClick = (tf) => {
    setActiveTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  return (
    <div className="main-content__header">
      <div className="header-title-area">
        <span className="header-subtitle">
          {"Market Intelligence"}
        </span>
        <h2 className="header-main-title">
          {selectedstock ? selectedstock.comp_name : "Stock Analysis Workspace"}
        </h2>
      </div>

      <div className="header-actions">
        {selectedstock && (
          <div className="timeframe-wrapper">
            {/* The text is now structurally placed above the placeholders */}
            <span className="timeframe-label">Timeframe</span>
            <div className="timeframe-placeholders">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-btn ${activeTimeframe === tf ? "active" : ""}`}
                  onClick={() => handleTimeframeClick(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HBMW;
