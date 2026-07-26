import "./NewsCard.css";
import { getSafeExternalUrl } from "../../../services/safeExternalUrl";

function formatNewsDate(dateValue) {
    if (!dateValue) return "";

    const numericDate = Number(dateValue);
    const timestamp = Number.isFinite(numericDate)
        ? numericDate < 10000000000
            ? numericDate * 1000
            : numericDate
        : new Date(dateValue).getTime();
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function NewsCard({ news }) {
    if (!news) return null;

    const formattedDate = formatNewsDate(news.date);
    const source = news.source || "Market News";
    const headline = news.headline || "Market update";
    const summary = news.content || "Open the article for the full market context.";
    const safeUrl = getSafeExternalUrl(news.url);

    return (
        <a href={safeUrl || undefined} target="_blank" rel="noopener noreferrer" className="news-card-link">
            <div className="news-card">
                <div className="news-card__content">
                    <div className="news-card__meta">
                        <span className="news-card__source">{source}</span>
                        {formattedDate && <span className="news-card__date">{formattedDate}</span>}
                    </div>
                    
                    <h3 className="news-card__headline">{headline}</h3>
                    <p className="news-card__summary">{summary}</p>
                    <div className="news-card__footer">
                        <span className="news-card__cue">Read article</span>
                        <span className="news-card__arrow" aria-hidden="true">-&gt;</span>
                    </div>
                </div>
            </div>
        </a>
    );
}

export default NewsCard;
