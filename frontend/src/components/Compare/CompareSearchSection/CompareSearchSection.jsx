import CompareSymbolPicker from "../CompareSymbolPicker/CompareSymbolPicker";
import "./CompareSearchSection.css";

function CompareSearchSection({
  firstAsset,
  secondAsset,
  onFirstAssetChange,
  onSecondAssetChange,
  onSubmit,
  canCompare,
  loading
}) {
  return (
    <form className="compare-controls" onSubmit={onSubmit}>
      <CompareSymbolPicker
        label="First Asset"
        value={firstAsset}
        onChange={onFirstAssetChange}
        disabled={loading}
      />
      <CompareSymbolPicker
        label="Second Asset"
        value={secondAsset}
        onChange={onSecondAssetChange}
        disabled={loading}
      />
      <button
        type="submit"
        className="compare-submit-btn"
        disabled={!canCompare || loading}
      >
        {loading ? "Comparing..." : "Compare"}
      </button>
    </form>
  );
}

export default CompareSearchSection;
