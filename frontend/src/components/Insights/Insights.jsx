import { useMemo } from "react";
import { buildInsights } from "./insightLogic";
import "./Insights.css";
import InsightsCard from "./InsightsCard/InsightsCard";

function Insights({ chartData, timeframe, selectedstock, loading }) {
  const insights = useMemo(
    () => buildInsights(chartData, timeframe, selectedstock),
    [chartData, timeframe, selectedstock]
  );

  return (
    <section className="insights-section">
      <div className="insights-header">
        <h2 className="insights-heading">Insights</h2>
        <span className="insights-timeframe">{timeframe}</span>
      </div>

      {loading ? (
        <div className="insights-loading">Updating insights...</div>
      ) : (
        <div className="insights-list">
          {insights.map((insight) => (
            <InsightsCard
              key={`${insight.label}-${insight.value}`}
              insight={insight}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Insights;
