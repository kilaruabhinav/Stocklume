import {
  formatCompactNumber,
  formatCurrency,
  formatMissing,
  formatNumber,
  getMetricValue
} from "./companyDetailsUtils";

function CompanyDetailsSummary({ profile, analysis, financialDetails }) {
  const fmpProfile = financialDetails?.profile;

  return (
    <div className="company-details-modal__summary">
      <div>
        <span>Industry</span>
        <strong>{formatMissing(profile?.finnhubIndustry || fmpProfile?.industry)}</strong>
      </div>
      <div>
        <span>Market Cap</span>
        <strong>{formatCompactNumber(profile?.marketCapitalization ?? analysis?.marketCap, { prefix: "$", multiplier: 1000000 })}</strong>
      </div>
      <div>
        <span>P/E</span>
        <strong>{formatNumber(getMetricValue(analysis, financialDetails, "peRatio", "peRatio"))}</strong>
      </div>
      <div>
        <span>52W Range</span>
        <strong>{formatCurrency(analysis?.week52Low)} - {formatCurrency(analysis?.week52High)}</strong>
      </div>
    </div>
  );
}

export default CompanyDetailsSummary;
