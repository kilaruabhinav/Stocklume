import "./CompareAdvancedStats.css";

function getRows(firstStats, secondStats) {
  const firstRows = new Map(firstStats.rows.map((row) => [row.label, row]));
  const secondRows = new Map(secondStats.rows.map((row) => [row.label, row]));

  return [...firstRows.keys()].map((label) => ({
    label,
    first: firstRows.get(label),
    second: secondRows.get(label)
  }));
}

function CompareAdvancedStats({
  firstStats,
  secondStats,
  relativeStats,
  insights,
  colors
}) {
  const hasStats = firstStats?.rows?.length && secondStats?.rows?.length;

  if (!hasStats) {
    return null;
  }

  const rows = getRows(firstStats, secondStats);

  return (
    <section className="compare-advanced-section" aria-label="Advanced comparison statistics">
      <div className="compare-insight-strip">
        {insights.map((item) => (
          <div className="compare-insight-pill" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="compare-relative-strip">
        {relativeStats.map((item) => (
          <div className="compare-relative-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="compare-stat-matrix">
        <div className="compare-stat-matrix__head">
          <span>Metric</span>
          <strong style={{ color: colors.first }}>{firstStats.ticker}</strong>
          <strong style={{ color: colors.second }}>{secondStats.ticker}</strong>
        </div>

        {rows.map((row) => (
          <div className="compare-stat-matrix__row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.first?.value || "N/A"}</strong>
            <strong>{row.second?.value || "N/A"}</strong>
            <p>{row.first?.detail || row.second?.detail || ""}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CompareAdvancedStats;
