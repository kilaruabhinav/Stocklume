import { useEffect, useMemo, useState } from "react";
import { buildMarketApiUrl, marketRequest } from "../../../services/marketApi";
import { getSafeExternalUrl } from "../../../services/safeExternalUrl";

const indexCards = [
  { label: "S&P 500", value: "6,214.18", move: "+0.42%" },
  { label: "NASDAQ", value: "20,186.63", move: "+0.68%" },
  { label: "Dow Jones", value: "44,173.64", move: "-0.12%" },
  { label: "VIX", value: "13.82", move: "-2.31%" }
];

const movers = [
  { ticker: "NVDA", name: "Nvidia", move: "+2.72%", price: "$184.91" },
  { ticker: "META", name: "Meta Platforms", move: "+1.06%", price: "$691.77" },
  { ticker: "AMD", name: "Advanced Micro Devices", move: "-1.35%", price: "$157.88" },
  { ticker: "TSLA", name: "Tesla", move: "-0.84%", price: "$329.65" }
];

const sectors = [
  { label: "Technology", move: "+0.92%" },
  { label: "Financials", move: "+0.31%" },
  { label: "Energy", move: "-0.44%" },
  { label: "Healthcare", move: "+0.18%" },
  { label: "Consumer", move: "-0.09%" }
];

const marketImageFallbacks = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=720&q=80",
  "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=720&q=80"
];

const fallbackHeadlines = [
  {
    source: "Reuters",
    headline: "Megacap technology remains the key group to watch during risk-on sessions",
    label: "Equities",
    image: marketImageFallbacks[0]
  },
  {
    source: "Bloomberg",
    headline: "Banks stay sensitive to Treasury yields and rate-cut expectations",
    label: "Financials",
    image: marketImageFallbacks[1]
  },
  {
    source: "CNBC",
    headline: "Energy names continue to track crude swings and inventory headlines",
    label: "Energy",
    image: marketImageFallbacks[2]
  },
  {
    source: "MarketWatch",
    headline: "Investors rotate between growth and defensive names as breadth narrows",
    label: "Markets",
    image: marketImageFallbacks[3]
  },
  {
    source: "Yahoo Finance",
    headline: "Retail traders focus on earnings momentum across large-cap software",
    label: "Earnings",
    image: marketImageFallbacks[4]
  },
  {
    source: "Seeking Alpha",
    headline: "Analysts flag valuation discipline as AI-linked stocks extend leadership",
    label: "Analysis",
    image: marketImageFallbacks[5]
  },
  {
    source: "Barron's",
    headline: "Semiconductor demand remains central to the next leg of tech performance",
    label: "Semis",
    image: marketImageFallbacks[6]
  },
  {
    source: "The Wall Street Journal",
    headline: "Treasury yields and dollar strength keep pressure on global risk assets",
    label: "Macro",
    image: marketImageFallbacks[7]
  }
];

const watchlist = [
  {
    ticker: "AAPL",
    name: "Apple",
    price: "$214.28",
    range: "88%",
    signal: "Near high",
    logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png"
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: "$512.40",
    range: "72%",
    signal: "Steady",
    logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/MSFT.png"
  },
  {
    ticker: "JPM",
    name: "JPMorgan Chase",
    price: "$291.33",
    range: "64%",
    signal: "Base build",
    logo: "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/JPM.png"
  },
  {
    ticker: "GOOGL",
    name: "Alphabet",
    price: "$179.62",
    range: "41%",
    signal: "Watch",
    logo: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
  }
];

const marketPulse = [
  { label: "Leadership", value: "Tech + semis", detail: "Momentum remains concentrated." },
  { label: "Risk tone", value: "Constructive", detail: "VIX is below recent stress levels." },
  { label: "Watch", value: "Energy", detail: "Weakest sector on the board." }
];

const actionQueue = [
  "Review stocks near 52-week highs before adding size.",
  "Compare sector leaders against the weakest watchlist name.",
  "Check news catalysts before market open."
];

function parsePercent(value) {
  const parsedValue = Number.parseFloat(String(value).replace("%", ""));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatSignedPercent(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buildMoverNotes(items) {
  const parsedItems = items.map((item) => ({
    ...item,
    moveValue: parsePercent(item.move)
  }));

  const strongest = parsedItems.reduce(
    (best, item) => (item.moveValue > best.moveValue ? item : best),
    parsedItems[0]
  );
  const weakest = parsedItems.reduce(
    (worst, item) => (item.moveValue < worst.moveValue ? item : worst),
    parsedItems[0]
  );
  const averageMove =
    parsedItems.reduce((total, item) => total + item.moveValue, 0) / parsedItems.length;

  return [
    {
      label: "Strongest",
      value: `${strongest.ticker} leads this sample at ${strongest.move}.`
    },
    {
      label: "Weakest",
      value: `${weakest.ticker} is the softest name at ${weakest.move}.`
    },
    {
      label: "Average move",
      value: `${formatSignedPercent(averageMove)} across the displayed movers.`
    }
  ];
}

function isLogoLikeImage(url = "") {
  const normalizedUrl = url.toLowerCase();

  return (
    !normalizedUrl ||
    normalizedUrl.includes("logo") ||
    normalizedUrl.includes("favicon") ||
    normalizedUrl.includes("icon") ||
    normalizedUrl.includes("avatar") ||
    normalizedUrl.includes("profile") ||
    normalizedUrl.includes("static2.finnhub.io/file/publicdatany")
  );
}

function getDisplayImage(article, index) {
  if (article?.image && !isLogoLikeImage(article.image)) {
    return article.image;
  }

  return marketImageFallbacks[index % marketImageFallbacks.length];
}

function getRelativeTime(timestamp, currentTime) {
  if (!timestamp) return "";

  const publishedAt = Number(timestamp) * 1000;

  if (!Number.isFinite(publishedAt)) return "";

  const differenceMinutes = Math.max(
    0,
    Math.floor((currentTime - publishedAt) / 60000)
  );

  if (differenceMinutes < 1) return "Just now";
  if (differenceMinutes < 60) return `${differenceMinutes}m ago`;

  const differenceHours = Math.floor(differenceMinutes / 60);
  if (differenceHours < 24) return `${differenceHours}h ago`;

  const differenceDays = Math.floor(differenceHours / 24);
  return `${differenceDays}d ago`;
}

function buildDiverseHeadlines(articles, limit = 8) {
  const seenHeadlines = new Set();
  const seenSources = new Set();
  const cleanedArticles = articles
    .filter((article) => article?.headline && article?.source)
    .map((article) => ({
      source: article.source,
      headline: article.headline,
      image: article.image,
      summary: article.summary,
      datetime: article.datetime,
      url: article.url
    }))
    .filter((article) => {
      const key = article.headline.toLowerCase().trim();

      if (seenHeadlines.has(key)) {
        return false;
      }

      seenHeadlines.add(key);
      return true;
    });

  const sourceDiverse = [];
  const sourceRepeats = [];

  cleanedArticles.forEach((article) => {
    if (!seenSources.has(article.source) && sourceDiverse.length < limit) {
      seenSources.add(article.source);
      sourceDiverse.push(article);
      return;
    }

    sourceRepeats.push(article);
  });

  return [...sourceDiverse, ...sourceRepeats].slice(0, limit);
}

function HomeMarketDashboard() {
  const [headlines, setHeadlines] = useState(fallbackHeadlines);
  const [usingLiveNews, setUsingLiveNews] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const moverNotes = useMemo(() => buildMoverNotes(movers), []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarketNews() {
      try {
        const response = await marketRequest(
          buildMarketApiUrl("/finnhub/general-news"),
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`News request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          return;
        }

        const nextHeadlines = buildDiverseHeadlines(data, 8);

        if (nextHeadlines.length > 0) {
          setHeadlines(nextHeadlines);
          setUsingLiveNews(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Home news error:", error);
          setUsingLiveNews(false);
        }
      }
    }

    loadMarketNews();

    return () => controller.abort();
  }, []);

  const displayHeadlines = useMemo(
    () =>
      [...headlines]
        .sort((firstItem, secondItem) => {
          const firstTime = Number(firstItem.datetime);
          const secondTime = Number(secondItem.datetime);

          if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) {
            return 0;
          }

          return secondTime - firstTime;
        })
        .map((item, index) => ({
          ...item,
          image: getDisplayImage(item, index),
          label: item.datetime
            ? getRelativeTime(item.datetime, currentTime)
            : item.label || "Brief"
        })),
    [headlines, currentTime]
  );

  return (
    <section className="home-market-dashboard" aria-label="Market dashboard preview">
      <section className="home-panel home-panel--news">
        <div className="home-panel__header">
          <h2>Market News</h2>
          <span>{usingLiveNews ? "Live feed" : "Brief"}</span>
        </div>

        <div className="home-headline-list">
          {displayHeadlines.map((item) => (
            <article className="home-news-card" key={item.headline}>
              <div className="home-news-card__media">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.parentElement.classList.add("has-fallback");
                      event.currentTarget.remove();
                    }}
                  />
                ) : null}
              </div>

              <div className="home-news-card__body">
                <div className="home-news-card__meta">
                  <span>{item.source}</span>
                  <time>{item.label}</time>
                </div>

                {getSafeExternalUrl(item.url) ? (
                  <a href={getSafeExternalUrl(item.url)} target="_blank" rel="noopener noreferrer">
                    {item.headline}
                  </a>
                ) : (
                  <h3>{item.headline}</h3>
                )}

                {item.summary ? <p>{item.summary}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="home-market-dashboard__header">
        <div>
          <span>Market overview</span>
          <h2>Today’s markets</h2>
        </div>
        <p>Indices, movers, sector performance, watchlist signals, and market headlines.</p>
      </div>

      <div className="home-dashboard-grid home-dashboard-grid--indices">
        {indexCards.map((item) => (
          <article className="home-index-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em className={item.move.startsWith("-") ? "is-down" : "is-up"}>
              {item.move}
            </em>
          </article>
        ))}
      </div>

      <div className="home-dashboard-grid home-dashboard-grid--single">
        <section className="home-panel home-panel--sector">
          <div className="home-panel__header">
            <h2>Sector Performance</h2>
            <span>Session</span>
          </div>

          <div className="home-sector-list">
            {sectors.map((sector) => (
              <div className="home-sector-row" key={sector.label}>
                <span>{sector.label}</span>
                <em className={sector.move.startsWith("-") ? "is-down" : "is-up"}>
                  {sector.move}
                </em>
              </div>
            ))}
          </div>

          <div className="home-market-pulse">
            {marketPulse.map((item) => (
              <div className="home-market-pulse__item" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="home-dashboard-grid">
        <section className="home-panel home-panel--wide">
          <div className="home-panel__header">
            <h2>Active Watchlist Movers</h2>
            <span>Today</span>
          </div>

          <div className="home-data-list">
            {movers.map((stock) => (
              <div className="home-data-row" key={stock.ticker}>
                <strong>{stock.ticker}</strong>
                <span>{stock.name}</span>
                <span>{stock.price}</span>
                <em className={stock.move.startsWith("-") ? "is-down" : "is-up"}>
                  {stock.move}
                </em>
              </div>
            ))}
          </div>

          <div className="home-mover-notes">
            {moverNotes.map((item) => (
              <div className="home-mover-note" key={item.label}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-panel">
          <div className="home-panel__header">
            <h2>Watchlist Snapshot</h2>
            <span>Range</span>
          </div>

          <div className="home-watchlist-table">
            {watchlist.map((stock) => (
              <div className="home-watchlist-row" key={stock.ticker}>
                <div className="home-watchlist-stock" title={stock.name}>
                  <span className="home-watchlist-logo" aria-hidden="true">
                    {stock.logo ? (
                      <img
                        src={stock.logo}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.parentElement.classList.add("has-logo-fallback");
                          event.currentTarget.remove();
                        }}
                      />
                    ) : null}
                    <b>{stock.ticker.charAt(0)}</b>
                  </span>
                  <strong>{stock.ticker}</strong>
                </div>
                <span>{stock.price}</span>
                <div className="home-range-meter" aria-hidden="true">
                  <i style={{ width: stock.range }} />
                </div>
                <span>{stock.signal}</span>
              </div>
            ))}
          </div>

          <div className="home-action-queue">
            <span>Next checks</span>
            {actionQueue.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default HomeMarketDashboard;
