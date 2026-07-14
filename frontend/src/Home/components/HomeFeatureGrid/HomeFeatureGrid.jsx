const features = [
  {
    label: "Price Action",
    title: "Trend, range, and momentum",
    copy: "See where the latest close sits against the selected window, recent highs, and short-term direction."
  },
  {
    label: "Fundamentals",
    title: "Valuation context",
    copy: "Keep market cap, P/E, EPS, beta, and 52-week levels beside the chart instead of buried in another tab."
  },
  {
    label: "Headlines",
    title: "News pressure",
    copy: "Scan what changed around the stock before deciding whether the move is technical, fundamental, or headline-led."
  }
];

function HomeFeatureGrid() {
  return (
    <section className="home-section">
      <div className="home-section__header">
        <span className="home-section__eyebrow">Research View</span>
        <h2>Read a stock from multiple angles, not one isolated chart.</h2>
      </div>

      <div className="home-feature-grid">
        {features.map((feature) => (
          <article className="home-feature-card" key={feature.label}>
            <span className="home-feature-card__label">{feature.label}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomeFeatureGrid;
