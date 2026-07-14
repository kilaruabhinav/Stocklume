import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatPercent } from "../compareUtils";
import { useThemeTokens } from "../../../hooks/useThemeTokens";
import "./CompareChart.css";

function CompareTooltip({ active, payload, label, firstTicker, secondTicker }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="compare-tooltip">
      <p className="compare-tooltip__date">{label}</p>
      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="compare-tooltip__value"
          style={{ color: item.color }}
        >
          {item.dataKey === "firstReturn" ? firstTicker : secondTicker}:{" "}
          {formatPercent(item.value)}
        </p>
      ))}
    </div>
  );
}

function CompareChart({ chartData, comparison, colors }) {
  const themeTokens = useThemeTokens();
  const firstTicker = comparison?.firstStock?.ticker || "Asset 1";
  const secondTicker = comparison?.secondStock?.ticker || "Asset 2";

  return (
    <section className="compare-chart-card">
      <div className="compare-chart-header">
        <div>
          <h2>Performance Comparison</h2>
          <p>Normalized return from the start of the selected timeframe.</p>
        </div>
        <div className="compare-legend">
          <span style={{ color: colors.first }}>{firstTicker}</span>
          <span style={{ color: colors.second }}>{secondTicker}</span>
        </div>
      </div>

      {chartData.length ? (
        <div className="compare-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 18, right: 24, bottom: 18, left: 8 }}
            >
              <CartesianGrid
                stroke={themeTokens.chartGrid}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                stroke={themeTokens.chartAxis}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                stroke={themeTokens.chartAxis}
                fontSize={12}
                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              />
              <Tooltip
                content={
                  <CompareTooltip
                    firstTicker={firstTicker}
                    secondTicker={secondTicker}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="firstReturn"
                stroke={colors.first}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="secondReturn"
                stroke={colors.second}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="compare-empty-state">
          Select two different assets and run a comparison.
        </div>
      )}
    </section>
  );
}

export default CompareChart;
