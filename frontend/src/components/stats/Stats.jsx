import { useMemo } from "react";
import "./Stats.css"

function getTimestamp(value) {
    if (value === null || value === undefined) return NaN;

    const numericTimestamp = Number(value);
    if (Number.isFinite(numericTimestamp)) return numericTimestamp;

    return new Date(value).getTime();
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") return "N/A";

    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    return `$${amount.toFixed(2)}`;
}

function formatSignedValue(value, suffix = "") {
    if (value === null || value === undefined || value === "") return "N/A";

    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)}${suffix}`;
}

function formatNumber(value) {
    if (value === null || value === undefined || value === "") return "N/A";

    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    return amount.toFixed(2);
}

function formatMarketCap(value) {
    if (value === null || value === undefined || value === "") return "N/A";

    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(2)}T`;
    }

    if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(2)}B`;
    }

    return `${amount.toFixed(2)}M`;
}

function getValueTone(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return "neutral";
    if (amount < 0) return "negative";
    if (amount > 0) return "positive";
    return "neutral";
}

function StatItem({ label, value, tone = "neutral", featured = false, detail = "" }) {
    return (
        <div className={`stats-item stats-item--${tone} ${featured ? "stats-item--featured" : ""}`}>
            <span className="stats-label">{label}</span>
            <span className="stats-value">{value}</span>
            {detail && <span className="stats-detail">{detail}</span>}
        </div>
    );
}

function StatsGroup({ title, stats, featured = false }) {
    return (
        <section className="stats-group">
            <div className="stats-section-label">{title}</div>
            <div className={featured ? "stats-highlight-grid" : "stats-responsive-grid"}>
                {stats.map((stat) => (
                    <StatItem key={stat.label} {...stat} />
                ))}
            </div>
        </section>
    );
}

function Stats({selectedstock, analize, chartData = [], timeframe = "1M"}){
    const timeframeStats = useMemo(() => {
        if (!Array.isArray(chartData) || chartData.length === 0) {
            return null;
        }

        const sortedPrices = chartData
            .map((point) => ({
                ...point,
                price: Number(point?.price),
                timestamp: getTimestamp(point?.timestamp)
            }))
            .filter(
                (point) =>
                    Number.isFinite(point.price) &&
                    Number.isFinite(point.timestamp)
            )
            .sort((a, b) => a.timestamp - b.timestamp);

        if (sortedPrices.length === 0) {
            return null;
        }

        const firstPoint = sortedPrices[0];
        const lastPoint = sortedPrices[sortedPrices.length - 1];
        const prices = sortedPrices.map((point) => point.price);
        const startPrice = firstPoint.price;
        const currentPrice = lastPoint.price;
        const change = currentPrice - startPrice;
        const percentChange =
            startPrice !== 0 ? (change / startPrice) * 100 : null;
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const range = high - low;
        const rangePercent = low !== 0 ? (range / low) * 100 : null;

        return {
            startPrice,
            currentPrice,
            change,
            percentChange,
            high,
            low,
            range,
            rangePercent
        };
    }, [chartData]);

    const currentPrice = timeframeStats?.currentPrice ?? selectedstock.price;
    const timeframeChange = timeframeStats?.change ?? selectedstock.change;
    const timeframePercentChange =
        timeframeStats?.percentChange ?? selectedstock.percentagechange;
    const changeNumber = Number(timeframeChange);
    const percentChangeNumber = Number(timeframePercentChange);
    const changeClass =
        !Number.isFinite(changeNumber)
            ? ""
            : changeNumber < 0
                ? "negative"
                : "positive";
    const percentChangeClass =
        !Number.isFinite(percentChangeNumber)
            ? ""
            : percentChangeNumber < 0
                ? "negative"
                : "positive";
    const changeTone = getValueTone(timeframeChange);
    const returnTone = getValueTone(timeframePercentChange);
    const week52ReturnTone = getValueTone(analize?.week52PriceReturn);
    const companyName = selectedstock?.comp_name || selectedstock?.ticker || "Selected asset";

    const priceStats = [
        {
            label: "Current Price",
            value: formatCurrency(currentPrice),
            tone: "neutral",
            featured: true,
            detail: timeframeStats ? "latest chart close" : "latest quote"
        },
        {
            label: `${timeframe} Change`,
            value: formatSignedValue(timeframeChange),
            tone: changeTone,
            featured: true,
            detail: changeClass || "unchanged"
        },
        {
            label: `${timeframe} Return`,
            value: formatSignedValue(timeframePercentChange, "%"),
            tone: returnTone,
            featured: true,
            detail: percentChangeClass || "unchanged"
        },
        {
            label: `${timeframe} Range`,
            value: formatSignedValue(timeframeStats?.rangePercent, "%"),
            tone: "neutral",
            featured: true,
            detail: `${formatCurrency(timeframeStats?.low)} - ${formatCurrency(timeframeStats?.high)}`
        }
    ];

    const valuationStats = [
        {
            label: "Market Cap",
            value: formatMarketCap(analize?.marketCap),
            detail: "reported"
        },
        {
            label: "P/E Ratio",
            value: formatNumber(analize?.peRatio),
            detail: "trailing"
        },
        {
            label: "EPS",
            value: formatNumber(analize?.eps),
            detail: "TTM"
        },
        {
            label: "Beta",
            value: formatNumber(analize?.beta),
            detail: "volatility"
        }
    ];

    const rangeStats = [
        {
            label: "52W High",
            value: formatCurrency(analize?.week52High),
            detail: "annual high"
        },
        {
            label: "52W Low",
            value: formatCurrency(analize?.week52Low),
            detail: "annual low"
        },
        {
            label: "52W Return",
            value: formatSignedValue(analize?.week52PriceReturn, "%"),
            tone: week52ReturnTone,
            detail: "daily return"
        },
        {
            label: `${timeframe} Open`,
            value: formatCurrency(timeframeStats?.startPrice),
            detail: "first close"
        },
        {
            label: `${timeframe} High`,
            value: formatCurrency(timeframeStats?.high),
            detail: "window high"
        },
        {
            label: `${timeframe} Low`,
            value: formatCurrency(timeframeStats?.low),
            detail: "window low"
        }
    ];

    return (
        <div className="statistics-container responsive-horizontal">
            <div className="statistics-header">
                <div>
                    <span className="statistics-eyebrow">{selectedstock.ticker}</span>
                    <h2 className="statistics-heading">Statistics</h2>
                    <p className="statistics-subtitle">{companyName}</p>
                </div>
                <span className="statistics-timeframe">{timeframe}</span>
            </div>

            <StatsGroup title="Price movement" stats={priceStats} featured />
            <StatsGroup title="Valuation" stats={valuationStats} />
            <StatsGroup title="52-week range" stats={rangeStats} />
        </div>
    );
}

export default Stats;
