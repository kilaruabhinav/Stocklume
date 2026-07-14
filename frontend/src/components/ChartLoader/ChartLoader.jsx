import "./ChartLoader.css";

function ChartLoader() {
  return (
    <div
      className="chart-skeleton-card"
      aria-label="Loading chart"
      aria-busy="true"
      role="status"
    >
      <div className="chart-skeleton-header">
        <div className="chart-skeleton-title skeleton-animation" />
        <div className="chart-skeleton-value skeleton-animation" />
      </div>

      <div className="chart-skeleton-content">
        <div className="chart-skeleton-y-axis">
          <div className="chart-skeleton-label skeleton-animation" />
          <div className="chart-skeleton-label skeleton-animation" />
          <div className="chart-skeleton-label skeleton-animation" />
          <div className="chart-skeleton-label skeleton-animation" />
        </div>

        <div className="chart-skeleton-area">
          <div className="chart-skeleton-grid-line grid-line-one" />
          <div className="chart-skeleton-grid-line grid-line-two" />
          <div className="chart-skeleton-grid-line grid-line-three" />
          <div className="chart-skeleton-grid-line grid-line-four" />

          <svg
            className="chart-skeleton-svg"
            viewBox="0 0 1000 260"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="chart-skeleton-fill skeleton-animation"
              d="
                M0 190
                C70 170, 110 195, 180 145
                C240 105, 290 130, 350 90
                C410 55, 455 110, 520 80
                C580 55, 625 150, 690 125
                C750 100, 800 145, 860 115
                C915 90, 950 145, 1000 110
                L1000 260
                L0 260
                Z
              "
            />

            <path
              className="chart-skeleton-line"
              d="
                M0 190
                C70 170, 110 195, 180 145
                C240 105, 290 130, 350 90
                C410 55, 455 110, 520 80
                C580 55, 625 150, 690 125
                C750 100, 800 145, 860 115
                C915 90, 950 145, 1000 110
              "
            />
          </svg>
        </div>
      </div>

      <div className="chart-skeleton-x-axis">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="chart-skeleton-date skeleton-animation"
          />
        ))}
      </div>
    </div>
  );
}

export default ChartLoader;