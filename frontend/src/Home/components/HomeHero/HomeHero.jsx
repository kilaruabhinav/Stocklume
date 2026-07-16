import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SimulationSnapshot from "../SimulationSnapshot/SimulationSnapshot";

const MARKET_TIME_ZONE = "America/New_York";
const MARKET_OPEN_MINUTES = 9 * 60 + 30;
const MARKET_CLOSE_MINUTES = 16 * 60;

const heroChecks = [
  { label: "Index tone", value: "Check S&P, Nasdaq, Dow, and volatility first" },
  { label: "Sector read", value: "Confirm whether leadership is broad or narrow" },
  { label: "Ticker setup", value: "Compare price action with news and range position" }
];

const etFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MARKET_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short"
});

function getEtParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const valueByType = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return {
    year: Number(valueByType.year),
    month: Number(valueByType.month),
    day: Number(valueByType.day),
    weekday: valueByType.weekday,
    hour: Number(valueByType.hour),
    minute: Number(valueByType.minute),
    second: Number(valueByType.second)
  };
}

function getTimeZoneOffsetMs(date) {
  const parts = getEtParts(date);
  const etAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return etAsUtc - date.getTime();
}

function etLocalToDate(year, month, day, hour, minute = 0) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = new Date(utcGuess - getTimeZoneOffsetMs(new Date(utcGuess)));
  return new Date(utcGuess - getTimeZoneOffsetMs(firstPass));
}

function formatEtEvent(date) {
  return etFormatter.format(date).replace(" EST", " ET").replace(" EDT", " ET");
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function addEtDays(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12));
  const nextParts = getEtParts(date);

  return {
    year: nextParts.year,
    month: nextParts.month,
    day: nextParts.day,
    weekday: nextParts.weekday
  };
}

function dateKey({ year, month, day }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nthWeekdayOfMonth(year, month, weekdayIndex, occurrence) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const day = 1 + ((weekdayIndex - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  return { year, month, day };
}

function lastWeekdayOfMonth(year, month, weekdayIndex) {
  const last = new Date(Date.UTC(year, month, 0));
  const day = last.getUTCDate() - ((last.getUTCDay() - weekdayIndex + 7) % 7);
  return { year, month, day };
}

function observedFixedHoliday(year, month, day) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  if (weekday === 6) return { year, month, day: day - 1 };
  if (weekday === 0) return { year, month, day: day + 1 };
  return { year, month, day };
}

function getGoodFriday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const goodFriday = new Date(Date.UTC(year, easterMonth - 1, easterDay - 2));

  return {
    year: goodFriday.getUTCFullYear(),
    month: goodFriday.getUTCMonth() + 1,
    day: goodFriday.getUTCDate()
  };
}

function getMarketHolidayKeys(year) {
  return new Set([
    observedFixedHoliday(year, 1, 1),
    nthWeekdayOfMonth(year, 1, 1, 3),
    nthWeekdayOfMonth(year, 2, 1, 3),
    getGoodFriday(year),
    lastWeekdayOfMonth(year, 5, 1),
    observedFixedHoliday(year, 6, 19),
    observedFixedHoliday(year, 7, 4),
    nthWeekdayOfMonth(year, 9, 1, 1),
    nthWeekdayOfMonth(year, 11, 4, 4),
    observedFixedHoliday(year, 12, 25)
  ].map(dateKey));
}

function isMarketBusinessDay(parts) {
  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

  if (weekdayIndex === 0 || weekdayIndex === 6) return false;
  return !getMarketHolidayKeys(parts.year).has(dateKey(parts));
}

function getNextBusinessDay(parts) {
  let candidate = parts;

  do {
    candidate = addEtDays(candidate, 1);
  } while (!isMarketBusinessDay(candidate));

  return candidate;
}

function getMarketStatus(now) {
  const parts = getEtParts(now);
  const minutesNow = parts.hour * 60 + parts.minute;
  const isBusinessDay = isMarketBusinessDay(parts);

  if (isBusinessDay && minutesNow >= MARKET_OPEN_MINUTES && minutesNow < MARKET_CLOSE_MINUTES) {
    const closeDate = etLocalToDate(parts.year, parts.month, parts.day, 16, 0);

    return {
      isOpen: true,
      statusLabel: "Open",
      nextLabel: "Closes",
      nextTime: formatEtEvent(closeDate),
      countdown: formatDuration(closeDate.getTime() - now.getTime()),
      etNow: formatEtEvent(now)
    };
  }

  const nextOpenDay =
    isBusinessDay && minutesNow < MARKET_OPEN_MINUTES
      ? parts
      : getNextBusinessDay(parts);
  const openDate = etLocalToDate(nextOpenDay.year, nextOpenDay.month, nextOpenDay.day, 9, 30);

  return {
    isOpen: false,
    statusLabel: "Closed",
    nextLabel: "Opens",
    nextTime: formatEtEvent(openDate),
    countdown: formatDuration(openDate.getTime() - now.getTime()),
    etNow: formatEtEvent(now)
  };
}

function HomeHero() {
  const [now, setNow] = useState(() => new Date());
  const marketStatus = useMemo(() => getMarketStatus(now), [now]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="home-hero">
      <div className="home-hero__content">
        <span className="home-eyebrow">Market prep</span>
        <h1 className="home-hero__title">Start with the market, then narrow to the ticker.</h1>
        <p className="home-hero__copy">
          Review index direction, sector strength, watchlist movement, and
          current headlines before opening a chart or comparing names.
        </p>

        <div className="home-hero__actions">
          <Link className="home-btn home-btn--primary" to="/dashboard">
            Open Dashboard
          </Link>
          <Link className="home-btn home-btn--secondary" to="/compare">
            Compare Assets
          </Link>
        </div>

        <div className="home-hero__meta" aria-label="Market review inputs">
          <div>
            <span>First read</span>
            <strong>Index direction and volatility</strong>
          </div>
          <div>
            <span>Second read</span>
            <strong>Sector strength and weak spots</strong>
          </div>
          <div>
            <span>Then drill in</span>
            <strong>Watchlist, chart, news, comparison</strong>
          </div>
        </div>

        <div className="home-hero__brief" aria-label="Research routine">
          <div className="home-hero__brief-header">
            <span>Decision flow</span>
            <strong>Use broad context before single-stock action</strong>
          </div>

          <div className="home-hero__brief-list">
            {heroChecks.map((item) => (
              <div className="home-hero__brief-item" key={item.label}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="home-hero__visual">
        <div className="home-workspace-panel">
          <div className="home-workspace-panel__header">
            <div>
              <span>US Market Status</span>
              <strong>NYSE and Nasdaq</strong>
            </div>
            <div className="home-workspace-panel__controls">
              <em className={marketStatus.isOpen ? "is-up" : "is-down"}>
                {marketStatus.statusLabel}
              </em>
            </div>
          </div>

          <div className="home-market-clock" aria-label="US stock market regular session status">
            <div className="home-market-clock__primary">
              <div>
                <span>{marketStatus.nextLabel}</span>
                <strong>{marketStatus.nextTime}</strong>
              </div>
              <small>in {marketStatus.countdown}</small>
            </div>
            <div className="home-market-clock__meta">
              <div>
                <span>Current ET</span>
                <strong>{marketStatus.etNow}</strong>
              </div>
              <div>
                <span>Regular hours</span>
                <strong>9:30 AM - 4:00 PM ET</strong>
              </div>
              <div>
                <span>Calendar</span>
                <strong>Weekends and holidays skipped</strong>
              </div>
            </div>
          </div>
        </div>

        <SimulationSnapshot />
      </div>
    </section>
  );
}

export default HomeHero;
