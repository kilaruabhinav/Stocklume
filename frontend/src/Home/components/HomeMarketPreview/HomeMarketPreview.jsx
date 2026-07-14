const rows = [
  { ticker: "MSFT", sector: "Software", price: "$512.40", move: "+1.18%" },
  { ticker: "NVDA", sector: "Semis", price: "$184.91", move: "+2.72%" },
  { ticker: "TSLA", sector: "Auto", price: "$329.65", move: "-0.84%" },
  { ticker: "JPM", sector: "Banks", price: "$291.33", move: "+0.34%" }
];

function HomeMarketPreview() {
  return (
    <section className="home-market-preview">
      <div className="home-market-preview__copy">
        <span className="home-section__eyebrow">Watchlist Sample</span>
        <h2>Markets are noisy. Your shortlist should not be.</h2>
        <p>
          Build a small list of names, compare their movement, and keep the
          research surface focused on the tickers you actually care about.
        </p>
      </div>

      <div className="home-market-table" aria-label="Sample market preview">
        <div className="home-market-row home-market-row--head">
          <span>Ticker</span>
          <span>Sector</span>
          <span>Last</span>
          <span>Move</span>
        </div>
        {rows.map((row) => (
          <div className="home-market-row" key={row.ticker}>
            <span>{row.ticker}</span>
            <small>{row.sector}</small>
            <strong>{row.price}</strong>
            <em className={row.move.startsWith("-") ? "is-down" : "is-up"}>
              {row.move}
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeMarketPreview;
