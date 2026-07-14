import { useEffect, useMemo, useRef, useState } from "react";
import { getChartData } from "../../services/GetChart/chartapi";
import { getStock } from "../../services/GetStats/stockapi";
import { useThemeTokens } from "../../hooks/useThemeTokens";
import CompareAdvancedStats from "./CompareAdvancedStats/CompareAdvancedStats";
import CompareChart from "./CompareChart/CompareChart";
import CompareHeader from "./CompareHeader/CompareHeader";
import CompareSearchSection from "./CompareSearchSection/CompareSearchSection";
import CompareSummaryGrid from "./CompareSummaryGrid/CompareSummaryGrid";
import {
  buildComparisonSeries,
  buildAdvancedStats,
  buildCompareInsights,
  buildRelativeStats,
  buildSummary,
  COMPARE_COLORS,
  TIMEFRAME_OPTIONS
} from "./compareUtils";
import "./Compare.css";

function Compare() {
  const themeTokens = useThemeTokens();
  const [firstAsset, setFirstAsset] = useState({
    ticker: "",
    companyName: "",
    finnhubSymbol: ""
  });
  const [secondAsset, setSecondAsset] = useState({
    ticker: "",
    companyName: "",
    finnhubSymbol: ""
  });
  const [timeframe, setTimeframe] = useState(TIMEFRAME_OPTIONS[0]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const comparedPairRef = useRef(null);

  const canCompare =
    firstAsset.ticker.trim() &&
    secondAsset.ticker.trim() &&
    firstAsset.ticker.trim().toUpperCase() !==
      secondAsset.ticker.trim().toUpperCase();

  const chartData = useMemo(() => {
    if (!comparison) return [];
    return buildComparisonSeries(
      comparison.firstChart?.prices,
      comparison.secondChart?.prices
    );
  }, [comparison]);

  const firstSummary = useMemo(
    () =>
      buildSummary(
        comparison?.firstStock || { ticker: firstAsset.ticker },
        comparison?.firstChart?.prices
      ),
    [comparison, firstAsset.ticker]
  );

  const secondSummary = useMemo(
    () =>
      buildSummary(
        comparison?.secondStock || { ticker: secondAsset.ticker },
        comparison?.secondChart?.prices
      ),
    [comparison, secondAsset.ticker]
  );

  const firstAdvancedStats = useMemo(
    () =>
      buildAdvancedStats(
        comparison?.firstStock || { ticker: firstAsset.ticker },
        comparison?.firstChart?.prices
      ),
    [comparison, firstAsset.ticker]
  );

  const secondAdvancedStats = useMemo(
    () =>
      buildAdvancedStats(
        comparison?.secondStock || { ticker: secondAsset.ticker },
        comparison?.secondChart?.prices
      ),
    [comparison, secondAsset.ticker]
  );

  const relativeStats = useMemo(
    () =>
      buildRelativeStats(
        firstSummary,
        secondSummary,
        firstAdvancedStats,
        secondAdvancedStats
      ),
    [firstSummary, secondSummary, firstAdvancedStats, secondAdvancedStats]
  );

  const compareInsights = useMemo(
    () =>
      buildCompareInsights(
        firstSummary,
        secondSummary,
        firstAdvancedStats,
        secondAdvancedStats
      ),
    [firstSummary, secondSummary, firstAdvancedStats, secondAdvancedStats]
  );
  const resolvedCompareColors = useMemo(
    () => ({
      first: themeTokens[COMPARE_COLORS.first],
      second: themeTokens[COMPARE_COLORS.second]
    }),
    [themeTokens]
  );

  const loadComparison = async ({
    first,
    second,
    activeTimeframe
  }) => {
    if (
      !first?.ticker?.trim() ||
      !second?.ticker?.trim() ||
      first.ticker.trim().toUpperCase() ===
        second.ticker.trim().toUpperCase()
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const firstTicker = first.ticker.trim().toUpperCase();
    const secondTicker = second.ticker.trim().toUpperCase();

    try {
      const [
        firstStock,
        secondStock,
        firstChartResponse,
        secondChartResponse
      ] = await Promise.all([
        getStock(
          firstTicker,
          first.companyName,
          first.finnhubSymbol
        ),
        getStock(
          secondTicker,
          second.companyName,
          second.finnhubSymbol
        ),
        getChartData(firstTicker, activeTimeframe.outputSize),
        getChartData(secondTicker, activeTimeframe.outputSize)
      ]);

      const firstChart = firstChartResponse?.[0];
      const secondChart = secondChartResponse?.[0];

      if (!firstStock || !secondStock || !firstChart || !secondChart) {
        setError("Could not load enough data for one or both assets.");
        setComparison(null);
        return;
      }

      setComparison({
        firstStock,
        secondStock,
        firstChart,
        secondChart
      });
    } catch (caughtError) {
      console.error("Comparison failed:", caughtError);
      setError("Comparison failed. Try another pair of symbols.");
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (event) => {
    event.preventDefault();

    if (!canCompare || loading) return;

    const pair = {
      first: firstAsset,
      second: secondAsset
    };

    comparedPairRef.current = pair;
    await loadComparison({
      ...pair,
      activeTimeframe: timeframe
    });
  };

  useEffect(() => {
    if (!comparedPairRef.current) return;

    loadComparison({
      ...comparedPairRef.current,
      activeTimeframe: timeframe
    });
  }, [timeframe]);

  return (
    <main className="compare-page">
      <section className="compare-shell">
        <CompareHeader
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />

        <CompareSearchSection
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          onFirstAssetChange={setFirstAsset}
          onSecondAssetChange={setSecondAsset}
          onSubmit={handleCompare}
          canCompare={Boolean(canCompare)}
          loading={loading}
        />

        {error && <div className="compare-error">{error}</div>}

        <CompareSummaryGrid
          firstSummary={firstSummary}
          secondSummary={secondSummary}
          colors={resolvedCompareColors}
        />

        <CompareChart
          chartData={chartData}
          comparison={comparison}
          colors={resolvedCompareColors}
        />

        <CompareAdvancedStats
          firstStats={firstAdvancedStats}
          secondStats={secondAdvancedStats}
          relativeStats={relativeStats}
          insights={compareInsights}
          colors={resolvedCompareColors}
        />
      </section>
    </main>
  );
}

export default Compare;
