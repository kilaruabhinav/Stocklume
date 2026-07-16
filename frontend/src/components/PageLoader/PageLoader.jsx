import "./PageLoader.css";

function PageLoader() {
  return (
    <main className="page-loader" aria-live="polite" aria-busy="true">
      <div className="page-loader__panel">
        <span className="page-loader__spinner" aria-hidden="true" />
        <span>Loading Stocklume...</span>
      </div>
    </main>
  );
}

export default PageLoader;
