const tickers = [
  { symbol: "AAPL", price: "$214.28", move: "+2.14%" },
  { symbol: "MSFT", price: "$512.40", move: "+1.18%" },
  { symbol: "NVDA", price: "$184.91", move: "+2.72%" },
  { symbol: "TSLA", price: "$329.65", move: "-0.84%" },
  { symbol: "AMZN", price: "$226.13", move: "+0.46%" },
  { symbol: "GOOGL", price: "$179.62", move: "-0.21%" },
  { symbol: "META", price: "$691.77", move: "+1.06%" },
  { symbol: "JPM", price: "$291.33", move: "+0.34%" },
  { symbol: "AMD", price: "$157.88", move: "-1.35%" },
  { symbol: "NFLX", price: "$1,287.21", move: "+0.73%" }
];

function HomeTickerTape() {
  const tapeItems = [...tickers, ...tickers];

  return (
    <section className="home-ticker-tape" aria-label="Market ticker tape">
      <div className="home-ticker-tape__track">
        {tapeItems.map((ticker, index) => (
          <div className="home-ticker-tape__item" key={`${ticker.symbol}-${index}`}>
            <strong>{ticker.symbol}</strong>
            <span>{ticker.price}</span>
            <em className={ticker.move.startsWith("-") ? "is-down" : "is-up"}>
              {ticker.move}
            </em>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeTickerTape;
