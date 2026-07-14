import "./InsightsCard.css";

function InsightsCard({ insight }) {
  if (!insight) return null;

  return (
    <div className={`insight-card insight-card--${insight.tone}`}>
      <div className="insight-card__accent" aria-hidden="true" />
      <div className="insight-card__topline">
        <div className="insight-card__heading">
          <span className="insight-card__tone-dot" aria-hidden="true" />
          <span className="insight-card__label">{insight.label}</span>
        </div>
        <span className="insight-card__value">{insight.value}</span>
      </div>
      {insight.meta && (
        <span className="insight-card__meta">{insight.meta}</span>
      )}
      <p className="insight-card__message">{insight.message}</p>
      {insight.action && (
        <p className="insight-card__action">{insight.action}</p>
      )}
      {Array.isArray(insight.details) && insight.details.length > 0 && (
        <div className="insight-card__details">
          {insight.details.map((detail) => (
            <span className="insight-card__detail" key={detail}>
              {detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default InsightsCard;
