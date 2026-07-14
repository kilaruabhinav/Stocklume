import CompareSummaryCard from "../CompareSummaryCard/CompareSummaryCard";
import "./CompareSummaryGrid.css";

function CompareSummaryGrid({ firstSummary, secondSummary, colors }) {
  return (
    <section className="compare-summary-grid">
      <CompareSummaryCard summary={firstSummary} accentColor={colors.first} />
      <CompareSummaryCard summary={secondSummary} accentColor={colors.second} />
    </section>
  );
}

export default CompareSummaryGrid;
