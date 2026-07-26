import { useCallback, useState, useEffect, useRef } from "react";

// Adjusted paths to step out of the Dashboard folder into src/
import { updateStock } from "../services/GetStats/updatestockapi";
import { getStock } from "../services/GetStats/stockapi";
import { getAnalysis } from "../services/GetStats/analysisapi";
import { getNews } from "../services/GetNews/getnews";
import { getChartData } from "../services/GetChart/chartapi";
import {
  addToWatchlist,
  deleteFromWatchlist,
  getWatchlist
} from "../services/Watchlist/watchlistApi";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const MAX_CHART_STALENESS_DAYS = 5;
const ONE_DAY = 24 * 60 * 60 * 1000;
const NEWS_CACHE_VERSION = 2;

const TIMEFRAME_WEIGHTS = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};

function getLocalDayStart(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getLatestPriceTimestamp(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return null;
  }

  const latestTimestamp = Math.max(
    ...prices.map((point) => Number(point?.timestamp)).filter(Number.isFinite)
  );

  return Number.isFinite(latestTimestamp) ? latestTimestamp : null;
}

function isFreshChartCache(cacheItem) {
  if (!cacheItem?.fetchedAt || Date.now() - Number(cacheItem.fetchedAt) >= SIX_HOURS) {
    return false;
  }

  const latestTimestamp = getLatestPriceTimestamp(cacheItem.prices);

  if (!latestTimestamp) {
    return false;
  }

  const ageInDays = Math.floor(
    (getLocalDayStart(Date.now()) - getLocalDayStart(latestTimestamp)) / ONE_DAY
  );

  return ageInDays <= MAX_CHART_STALENESS_DAYS;
}

function readArrayCache(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

export function DashboardHooks() {
  const [CurrTimeframe, setCurrTimeframe] = useState("1M");
  const [ChartCache, setChartCache] = useState(() => readArrayCache("ChartCache"));
  const [currentNews, setCurrentNews] = useState([]);

  const [NewsData, SetNewsData] = useState(
    () => readArrayCache("newsCache")
  );
  const [analysisData, setAnalysisData] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analoading, setanaLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [ChartLoading, setChartLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [toasts, setToasts] = useState([]);
  const chartCacheRef = useRef(ChartCache);
  const activeChartRequestRef = useRef(0);
  const activeSelectionRequestRef = useRef(0);
  const repairedWatchlistRef = useRef(false);
  const stocksRef = useRef(stocks);
  const quoteRefreshInFlightRef = useRef(false);

  function addToast({ title, message = "", type = "info" }) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3600);
  }

  function dismissToast(id) {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }

  function handleSimulationBuySuccess({ symbol, quantity, totalValue }) {
    addToast({
      title: "Virtual buy complete",
      message: `${quantity} ${symbol} bought for $${totalValue.toFixed(2)}.`,
      type: "success"
    });
  }

  // Main Chart Cache Management and Fetching Effect
  useEffect(() => {
    if (!selectedStock) {
      activeChartRequestRef.current += 1;
      setChartData([]);
      setChartLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = activeChartRequestRef.current + 1;
    activeChartRequestRef.current = requestId;
    const isActiveRequest = () =>
      !cancelled && activeChartRequestRef.current === requestId;

    async function processChartData() {
      const ticker = selectedStock.ticker;
      const daysRequired = TIMEFRAME_WEIGHTS[CurrTimeframe] || 30;

      const cachedStockData = chartCacheRef.current.find(
        (item) => item.ticker === ticker
      );

      const hasEnoughData =
        cachedStockData &&
        isFreshChartCache(cachedStockData) &&
        TIMEFRAME_WEIGHTS[cachedStockData.range] >=
          TIMEFRAME_WEIGHTS[CurrTimeframe];

      if (hasEnoughData) {
        const trimmedPrices =
          cachedStockData.prices.slice(-daysRequired);

        if (isActiveRequest()) {
          setChartData(trimmedPrices);
          setChartLoading(false);
        }

        return;
      }

      setChartLoading(true);

      try {
        let apiDaysParam = 30;

        if (CurrTimeframe === "3M") apiDaysParam = 90;
        if (CurrTimeframe === "6M") apiDaysParam = 180;
        if (CurrTimeframe === "1Y") apiDaysParam = 365;

        const response = await getChartData(
          ticker,
          apiDaysParam
        );

        if (!isActiveRequest()) return;

        const chartDataObj = response?.[0];

        if (!chartDataObj?.prices) {
          setChartData([]);
          return;
        }

        const viewPrices =
          chartDataObj.prices.slice(-daysRequired);

        setChartData(viewPrices);

        const updatedChartObj = {
          ...chartDataObj,
          range: CurrTimeframe,
        };
        setChartCache((previousCache) => {
          const clearedCache = previousCache.filter(
            (item) => item.ticker !== ticker
          );
          const updatedCache = [...clearedCache, updatedChartObj];
          chartCacheRef.current = updatedCache;
          return updatedCache;
        });
      } catch (error) {
        console.error("Chart fetch failed:", error);

        if (isActiveRequest()) {
          setChartData([]);
        }
      } finally {
        if (isActiveRequest()) {
          setChartLoading(false);
        }
      }
    }
    processChartData();
    return () => {
      cancelled = true;
    };
  }, [selectedStock, CurrTimeframe]);

  // Synchronize ChartCache to localStorage when state alters
  useEffect(() => {
    chartCacheRef.current = ChartCache;
    localStorage.setItem("ChartCache", JSON.stringify(ChartCache));
  }, [ChartCache]);

  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  // Synchronize newsCache to localStorage when state alters
  useEffect(() => {
    localStorage.setItem("newsCache", JSON.stringify(NewsData));
  }, [NewsData]);

  // Load the user's watchlist from MySQL, then enrich each symbol with live stock data.
  useEffect(() => {
    let cancelled = false;

    async function loadWatchlist() {
      setWatchlistLoading(true);

      try {
        const savedWatchlist = await getWatchlist();
        const loadedStocks = await Promise.all(
          savedWatchlist.map(async (item) => {
            try {
              const stockData = await getStock(item.symbol);

              if (!stockData) {
                throw new Error("No stock data returned.");
              }

              return {
                id: item.id,
                ticker: item.symbol,
                comp_name: stockData.companyName,
                price: stockData.price,
                change: stockData.change,
                percentagechange: stockData.percentChange
              };
            } catch (error) {
              console.error(`Could not load ${item.symbol}:`, error);

              return {
                id: item.id,
                ticker: item.symbol,
                comp_name: item.symbol,
                price: null,
                change: null,
                percentagechange: null
              };
            }
          })
        );

        if (!cancelled) {
          setStocks(loadedStocks);
          if (loadedStocks.length > 0) {
            addToast({
              title: "Watchlist synced",
              message: `${loadedStocks.length} saved asset${loadedStocks.length === 1 ? "" : "s"} loaded.`,
              type: "success"
            });
          }
        }
      } catch (error) {
        console.error("Watchlist load failed:", error);
        if (!cancelled) {
          addToast({
            title: "Could not load watchlist",
            message: error.message,
            type: "error"
          });
        }
      } finally {
        if (!cancelled) {
          setWatchlistLoading(false);
        }
      }
    }

    loadWatchlist();

    return () => {
      cancelled = true;
    };
  }, []);

  function onTimeframeChange(t) {
    setCurrTimeframe(t);
  }

  const refreshWatchlistQuotes = useCallback(async () => {
    const currentStocks = stocksRef.current;

    if (quoteRefreshInFlightRef.current || currentStocks.length === 0) {
      return;
    }

    quoteRefreshInFlightRef.current = true;

    try {
      const updatedStocks = await Promise.all(
        currentStocks.map(async (stock) => {
          const freshData = await updateStock(stock.ticker);
          if (!freshData) return stock;
          return {
            ...stock,
            price: freshData.price,
            change: freshData.change,
            percentagechange: freshData.percentageChange
          };
        })
      );

      const updatedById = new Map(updatedStocks.map((stock) => [stock.id, stock]));

      setStocks((latestStocks) =>
        latestStocks.map((stock) => updatedById.get(stock.id) || stock)
      );
    } finally {
      quoteRefreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshWatchlistQuotes();
    }, 120000);

    return () => clearInterval(interval);
  }, [refreshWatchlistQuotes]);

  useEffect(() => {
    if (!repairedWatchlistRef.current && stocks.length > 0) {
      repairedWatchlistRef.current = true;
      refreshWatchlistQuotes();
    }
  }, [refreshWatchlistQuotes, stocks]);

  async function handleNews(stock) {
    const ticker = stock.ticker;
    const cachedNews = NewsData.find(item => item.ticker === ticker);
    if (
      cachedNews &&
      cachedNews.cacheVersion === NEWS_CACHE_VERSION &&
      Date.now() - cachedNews.fetchedAt < SIX_HOURS
    ) {
      return cachedNews.news;
    }
    const freshNews = await getNews(ticker, stock.comp_name);
    const newsObject = {
      ticker,
      fetchedAt: Date.now(),
      cacheVersion: NEWS_CACHE_VERSION,
      news: freshNews
    };
    SetNewsData(prev => [...prev.filter(item => item.ticker !== ticker), newsObject]);
    return freshNews;
  }

  async function handleSelectStock(stock) {
    const requestId = activeSelectionRequestRef.current + 1;
    activeSelectionRequestRef.current = requestId;
    const isActiveRequest = () =>
      activeSelectionRequestRef.current === requestId;

    setanaLoading(true);
    setNewsLoading(true);
    setSelectedStock(stock);
    const analysis = await getAnalysis(stock.ticker);
    if (!isActiveRequest()) return;
    setAnalysisData(analysis);
    setanaLoading(false);
    const news = await handleNews(stock);
    if (!isActiveRequest()) return;
    setCurrentNews(news);
    setNewsLoading(false);
  }

  const getData = async (data) => {
    setLoading(true);
    const ticker = data.ticker.trim().toUpperCase();

    try {
      if (!ticker) {
        addToast({
          title: "Enter a ticker",
          message: "Type a symbol before adding it.",
          type: "info"
        });
        return;
      }

      const exists = stocks.some(stock => stock.ticker === ticker);
      if (exists) {
        addToast({
          title: "Already in watchlist",
          message: `${ticker} is already being tracked.`,
          type: "info"
        });
        return;
      }

      let stockdata = null;

      try {
        stockdata = await getStock(ticker, data.companyName, data.finnhubSymbol);
      } catch (error) {
        console.error(`Could not load ${ticker}:`, error);
      }

      const savedStock = await addToWatchlist(ticker);
      const savedStockId = savedStock.watchlist_item?.id;

      if (!savedStockId) {
        throw new Error("Watchlist item was saved, but the backend did not return its database ID.");
      }

      setStocks(prev => [
        ...prev,
        {
          id: savedStockId,
          ticker,
          comp_name: stockdata?.companyName || data.companyName || ticker,
          price: stockdata?.price ?? null,
          change: stockdata?.change ?? null,
          percentagechange: stockdata?.percentChange ?? null
        }
      ]);
      addToast({
        title: "Stock added",
        message: `${ticker} was saved to your watchlist.`,
        type: "success"
      });
    } catch (error) {
      console.error("Could not add stock to watchlist:", error);
      addToast({
        title: "Could not add stock",
        message: error.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  async function DeleteStock(id) {
    const stock = stocks.find(item => item.id === id);

    if (!stock) {
      addToast({
        title: "Stock not found",
        message: "Refresh the watchlist and try again.",
        type: "error"
      });
      return;
    }

    try {
      await deleteFromWatchlist(stock.ticker);
      setStocks(prevStocks => prevStocks.filter(item => item.id !== id));

      if (selectedStock?.id === id) {
        setSelectedStock(null);
        setAnalysisData([]);
        setCurrentNews([]);
      }
      addToast({
        title: "Stock removed",
        message: `${stock.ticker} was removed from your watchlist.`,
        type: "success"
      });
    } catch (error) {
      console.error("Could not delete stock from watchlist:", error);
      addToast({
        title: "Could not remove stock",
        message: error.message,
        type: "error"
      });
    }
  }

  return {
    stocks,
    selectedStock,
    loading,
    watchlistLoading,
    analoading,
    newsLoading,
    analysisData,
    currentNews,
    chartData,
    toasts,
    getData,
    DeleteStock,
    handleSelectStock,
    handleSimulationBuySuccess,
    onTimeframeChange,
    dismissToast,
    CurrTimeframe,
    ChartLoading
  };
}
