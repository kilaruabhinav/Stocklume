import "./News.css";
import NewsCard from "./NewsCard/NewsCard";
import NewsLoader from "../NewsLoader/NewsLoader";

function News({ news, newsloading }) {
    return (
        <div className="news-section-container">
            <h2 className="news-section-heading">News</h2>
            
            {newsloading ? (
                /* 1. ACTIVE FETCHING STATE */
                <NewsLoader />
            ) : news && news.length > 0 ? (
                /* 2. SUCCESS DATA STATE */
                <div className="news-cards-grid">
                    {news.map((item, index) => (
                        <NewsCard key={item.id || index} news={item}/>
                    ))}
                </div>
            ) : (
                /* 3. NULL/EMPTY FALLBACK STATE */
                <div className="news-empty-state">
                    <p>No recent market news available for this asset.</p>
                </div>
            )}
        </div>
    );
}

export default News;
