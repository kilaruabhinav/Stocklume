import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useThemeTokens } from "../../hooks/useThemeTokens";
import { formatFinancialAmount } from "./companyDetailsUtils";

function buildChartData(statements, dataKey) {
  return statements
    .map((statement) => ({
      period: statement.date,
      value: Number(statement[dataKey])
    }))
    .filter((item) => Number.isFinite(item.value));
}

function getNiceStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  const niceFraction =
    fraction <= 1
      ? 1
      : fraction <= 1.25
        ? 1.25
        : fraction <= 2
          ? 2
          : fraction <= 2.5
            ? 2.5
            : fraction <= 5
              ? 5
              : 10;

  return niceFraction * magnitude;
}

function buildTicks(start, end, step) {
  const ticks = [];

  for (let value = start; value <= end + step * 0.5; value += step) {
    ticks.push(Math.abs(value) < step * 0.001 ? 0 : value);
  }

  return ticks;
}

function getYAxisScale(data) {
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min >= 0) {
    const step = getNiceStep((max || 1) / 4);
    const maxTick = step * Math.ceil((max || 1) / step);

    return {
      domain: [0, maxTick],
      ticks: buildTicks(0, maxTick, step)
    };
  }

  if (max <= 0) {
    const step = getNiceStep(Math.abs(min || 1) / 4);
    const minTick = -step * Math.ceil(Math.abs(min || 1) / step);

    return {
      domain: [minTick, 0],
      ticks: buildTicks(minTick, 0, step)
    };
  }

  const step = getNiceStep((max - min) / 4);
  const minTick = step * Math.floor(min / step);
  const maxTick = step * Math.ceil(max / step);

  return {
    domain: [minTick, maxTick],
    ticks: buildTicks(minTick, maxTick, step)
  };
}

function formatAxisAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  const absNumber = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (absNumber >= 1_000_000_000_000) {
    return `${sign}${Number((absNumber / 1_000_000_000_000).toFixed(1))}T`;
  }

  if (absNumber >= 1_000_000_000) {
    return `${sign}${Number((absNumber / 1_000_000_000).toFixed(1))}B`;
  }

  if (absNumber >= 1_000_000) {
    return `${sign}${Number((absNumber / 1_000_000).toFixed(1))}M`;
  }

  return `${sign}${Number(absNumber.toFixed(1))}`;
}

function FinancialTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="company-details-chart-tooltip">
      <span>{label}</span>
      <strong>{formatFinancialAmount(payload[0].value)}</strong>
    </div>
  );
}

function FinancialBarChart({ title, data, color }) {
  const themeTokens = useThemeTokens();

  if (data.length === 0) {
    return null;
  }

  const yAxisScale = getYAxisScale(data);

  return (
    <div className="company-details-chart">
      <div className="company-details-chart__header">
        <span>{title}</span>
        <strong>{formatFinancialAmount(data[data.length - 1]?.value)}</strong>
      </div>

      <div className="company-details-chart__canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={themeTokens.chartGrid} vertical={false} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: themeTokens.textMuted, fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: themeTokens.chartAxis, fontSize: 10, fontWeight: 700 }}
              tickFormatter={formatAxisAmount}
              domain={yAxisScale.domain}
              ticks={yAxisScale.ticks}
              width={66}
            />
            <Tooltip
              content={<FinancialTooltip />}
              cursor={{ fill: themeTokens.rowHover }}
              position={{ x: 10, y: 10 }}
            />
            <Bar dataKey="value" fill={color} radius={[7, 7, 3, 3]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinancialBarCharts({ statements }) {
  const themeTokens = useThemeTokens();
  const revenueData = buildChartData(statements, "totalRevenue");
  const netIncomeData = buildChartData(statements, "netIncome");

  if (revenueData.length === 0 && netIncomeData.length === 0) {
    return null;
  }

  return (
    <div className="company-details-charts">
      <FinancialBarChart title="Revenue" data={revenueData} color={themeTokens.accent} />
      <FinancialBarChart title="Net Income" data={netIncomeData} color={themeTokens.success} />
    </div>
  );
}

export default FinancialBarCharts;
