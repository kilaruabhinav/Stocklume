import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./ChartData.css";
import ChartSkeleton from "../ChartLoader/ChartLoader";
import { useThemeTokens } from "../../hooks/useThemeTokens";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const axisCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatHoverDate = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatAxisDate = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatYAxisPrice = (value) => {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return "";
  }

  return axisCurrencyFormatter.format(price);
};

const calculateSma = (items, period) => {
  let runningTotal = 0;

  return items.map((item, index) => {
    runningTotal += item.price;

    if (index >= period) {
      runningTotal -= items[index - period].price;
    }

    if (index < period - 1) {
      return null;
    }

    return runningTotal / period;
  });
};

const CustomTooltip = ({ active, payload, themeColor }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  const price = Number(point?.price);

  if (!point || !Number.isFinite(price)) {
    return null;
  }

  return (
    <div className="stock-chart-tooltip">
      <p className="stock-chart-tooltip-date">
        {formatHoverDate(point.timestamp)}
      </p>

      <p
        className="stock-chart-tooltip-price"
        style={{ color: themeColor }}
      >
        {currencyFormatter.format(price)}
      </p>

      {payload
        .filter((item) => item.dataKey !== "price")
        .map((item) => {
          const value = Number(item.value);

          if (!Number.isFinite(value)) {
            return null;
          }

          return (
            <p
              className="stock-chart-tooltip-indicator"
              key={item.dataKey}
              style={{ color: item.color }}
            >
              {item.name}: {currencyFormatter.format(value)}
            </p>
          );
        })}
    </div>
  );
};

function ChartData({
  data = [],
  ChartLoading,
  error = null,
}) {
  const themeTokens = useThemeTokens();
  const [activeOverlays, setActiveOverlays] = useState({
    sma20: false,
    sma50: false,
  });

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => ({
        ...item,
        timestamp: new Date(item?.timestamp).getTime(),
        price: Number(item?.price),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.timestamp) &&
          Number.isFinite(item.price)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const chartSeries = useMemo(() => {
    if (!sortedData.length) {
      return [];
    }

    const sma20 = calculateSma(sortedData, 20);
    const sma50 = calculateSma(sortedData, 50);

    return sortedData.map((item, index) => ({
      ...item,
      sma20: sma20[index],
      sma50: sma50[index],
    }));
  }, [sortedData]);

  const themeColor = useMemo(() => {
    if (sortedData.length < 2) {
      return themeTokens.accent;
    }

    const firstPrice = sortedData[0].price;
    const lastPrice = sortedData[sortedData.length - 1].price;

    return lastPrice >= firstPrice
      ? themeTokens.success
      : themeTokens.danger;
  }, [sortedData, themeTokens.accent, themeTokens.danger, themeTokens.success]);

  const yAxisDomain = useMemo(() => {
    if (!chartSeries.length) {
      return ["auto", "auto"];
    }

    const prices = chartSeries.flatMap((item) => {
      const values = [item.price];

      if (activeOverlays.sma20 && Number.isFinite(item.sma20)) {
        values.push(item.sma20);
      }

      if (activeOverlays.sma50 && Number.isFinite(item.sma50)) {
        values.push(item.sma50);
      }

      return values;
    });

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;

    const padding =
      range === 0
        ? Math.max(Math.abs(minPrice) * 0.02, 1)
        : range * 0.12;

    return [
      Math.max(0, minPrice - padding),
      maxPrice + padding,
    ];
  }, [activeOverlays.sma20, activeOverlays.sma50, chartSeries]);

  const xAxisTicks = useMemo(() => {
    if (!sortedData.length) {
      return [];
    }

    const desiredTickCount = 7;

    if (sortedData.length <= desiredTickCount) {
      return sortedData.map((point) => point.timestamp);
    }

    const lastIndex = sortedData.length - 1;

    const tickIndexes = Array.from(
      { length: desiredTickCount },
      (_, index) =>
        Math.round(
          (index * lastIndex) / (desiredTickCount - 1)
        )
    );

    return [
      ...new Set(
        tickIndexes.map(
          (dataIndex) => sortedData[dataIndex].timestamp
        )
      ),
    ];
  }, [sortedData]);

  const overlayAvailability = useMemo(
    () => ({
      sma20: sortedData.length >= 20,
      sma50: sortedData.length >= 50,
    }),
    [sortedData.length]
  );

  const unavailableOverlayText = useMemo(() => {
    const unavailable = [];

    if (activeOverlays.sma20 && !overlayAvailability.sma20) {
      unavailable.push("SMA20");
    }

    if (activeOverlays.sma50 && !overlayAvailability.sma50) {
      unavailable.push("SMA50");
    }

    if (!unavailable.length) {
      return "";
    }

    return `${unavailable.join(" and ")} needs more price points for this timeframe.`;
  }, [
    activeOverlays.sma20,
    activeOverlays.sma50,
    overlayAvailability.sma20,
    overlayAvailability.sma50,
  ]);

  const toggleOverlay = (overlayKey) => {
    setActiveOverlays((currentOverlays) => ({
      ...currentOverlays,
      [overlayKey]: !currentOverlays[overlayKey],
    }));
  };

  if (ChartLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return (
      <div className="stock-chart-card">
        <div className="stock-chart-state stock-chart-error">
          <p className="stock-chart-state-title">
            Unable to load chart
          </p>

          <p className="stock-chart-state-message">
            {typeof error === "string"
              ? error
              : error?.message || "Something went wrong."}
          </p>
        </div>
      </div>
    );
  }

  if (!sortedData.length) {
    return (
      <div className="stock-chart-card">
        <div className="stock-chart-state stock-chart-empty">
          <p className="stock-chart-state-title">
            No chart data available
          </p>

          <p className="stock-chart-state-message">
            Price history will appear here once data is available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-chart-card">
      <div className="stock-chart-toolbar">
        <div>
          <p className="stock-chart-toolbar-title">Overlays</p>
          {unavailableOverlayText && (
            <p className="stock-chart-toolbar-note">
              {unavailableOverlayText}
            </p>
          )}
        </div>

        <div className="stock-chart-overlay-controls">
          <button
            type="button"
            className={`stock-chart-overlay-btn ${activeOverlays.sma20 ? "is-active" : ""}`}
            onClick={() => toggleOverlay("sma20")}
          >
            SMA20
          </button>
          <button
            type="button"
            className={`stock-chart-overlay-btn ${activeOverlays.sma50 ? "is-active" : ""}`}
            onClick={() => toggleOverlay("sma50")}
          >
            SMA50
          </button>
        </div>
      </div>

      <div className="stock-chart-graph">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartSeries}
            margin={{
              top: 20,
              right: 24,
              left: 8,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={themeTokens.chartGrid}
            />

            <XAxis
              dataKey="timestamp"
              type="category"
              ticks={xAxisTicks}
              tickLine={false}
              axisLine={false}
              tickMargin={14}
              tickFormatter={formatAxisDate}
              stroke={themeTokens.chartAxis}
              fontSize={12}
              padding={{
                left: 8,
                right: 8,
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={72}
              domain={yAxisDomain}
              tickFormatter={formatYAxisPrice}
              stroke={themeTokens.chartAxis}
              fontSize={12}
            />

            <Tooltip
              content={
                <CustomTooltip themeColor={themeColor} />
              }
              cursor={{
                stroke: themeTokens.borderStrong,
                strokeWidth: 1.5,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              name="Price"
              stroke={themeColor}
              strokeWidth={3}
              fill={themeColor}
              fillOpacity={0.08}
              connectNulls
              isAnimationActive={false}
              activeDot={{
                r: 6,
                stroke: themeTokens.surface,
                strokeWidth: 3,
                fill: themeColor,
              }}
            />

            {activeOverlays.sma20 && overlayAvailability.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                name="SMA20"
                stroke={themeTokens.warning}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  stroke: themeTokens.surface,
                  strokeWidth: 2,
                  fill: themeTokens.warning,
                }}
              />
            )}

            {activeOverlays.sma50 && overlayAvailability.sma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                name="SMA50"
                stroke={themeTokens.accent}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
                activeDot={{
                  r: 4,
                  stroke: themeTokens.surface,
                  strokeWidth: 2,
                  fill: themeTokens.accent,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartData;
