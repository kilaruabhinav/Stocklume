import "./NewsLoader.css";

function NewsLoader() {
    // Generates 4 side-by-side skeleton blocks to populate the empty view area
    return (
        <div className="news-cards-grid text-unselectable">
            {[...Array(4)].map((_, index) => (
                <div className="news-skeleton-card" key={index}>
                    <div className="news-skeleton-thumbnail news-shimmer"></div>
                    
                    <div className="news-skeleton-content">
                        <div className="news-skeleton-meta news-shimmer"></div>
                        <div className="news-skeleton-title news-shimmer"></div>
                        <div className="news-skeleton-line news-shimmer"></div>
                        <div className="news-skeleton-line short news-shimmer"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default NewsLoader;
