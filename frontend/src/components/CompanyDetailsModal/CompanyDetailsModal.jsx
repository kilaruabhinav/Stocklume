import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getCompanyProfile } from "../../services/CompanyProfile/companyProfileApi";
import { getFinancialDetails } from "../../services/FinancialDetails/financialDetailsApi";
import { getSafeExternalUrl } from "../../services/safeExternalUrl";
import CompanyDetailsBreakdown from "./CompanyDetailsBreakdown";
import CompanyDetailsSummary from "./CompanyDetailsSummary";
import IncomeStatementTable from "./IncomeStatementTable";
import { getCompanyDisplayData } from "./companyDetailsUtils";
import "./CompanyDetailsModal.css";

const summarySkeletonLabels = ["Industry", "Market Cap", "P/E", "52W Range"];
const breakdownSkeletonSections = [
  {
    title: "Overview",
    rows: ["Exchange", "Sector", "Country"]
  },
  {
    title: "Valuation",
    rows: ["Market Cap", "P/E Ratio", "EPS"]
  }
];
const statementSkeletonRows = [
  "Revenue",
  "Gross Profit",
  "Operating Income",
  "Net Income"
];
const statementSkeletonColumns = ["TTM", "2025", "2024", "2023"];

function CompanyDetailsSkeleton() {
  return (
    <div className="company-details-modal__blueprint" role="status" aria-live="polite">
      <span className="company-details-modal__sr-only">Loading company details</span>

      <div className="company-details-modal__summary">
        {summarySkeletonLabels.map((label, index) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              <span className={`company-details-modal__shimmer company-details-modal__shimmer--summary company-details-modal__shimmer--w${index + 1}`} />
            </strong>
          </div>
        ))}
      </div>

      <div className="company-details-modal__state company-details-modal__state--loading">
        <span className="company-details-modal__spinner" aria-hidden="true" />
        Loading latest profile and financial statements...
      </div>

      <div className="company-details-modal__table-wrap">
        <table className="company-details-modal__table">
          <thead>
            <tr>
              <th>Breakdown</th>
              <th>Latest Available</th>
            </tr>
          </thead>
          <tbody>
            {breakdownSkeletonSections.map((section) => (
              <Fragment key={section.title}>
                <tr className="company-details-modal__section-row">
                  <td colSpan="2">{section.title}</td>
                </tr>
                {section.rows.map((label, rowIndex) => (
                  <tr key={`${section.title}-${label}`}>
                    <td>{label}</td>
                    <td>
                      <span className={`company-details-modal__shimmer company-details-modal__shimmer--value company-details-modal__shimmer--row${rowIndex + 1}`} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="company-details-modal__statement">
        <div className="company-details-modal__statement-header">
          <div>
            <span>Financials</span>
            <strong>Income Statement</strong>
          </div>
          <p>Annual periods with TTM when quarterly data is available.</p>
        </div>

        <div className="company-details-charts">
          {["Revenue", "Net Income"].map((title) => (
            <div className="company-details-chart" key={title}>
              <div className="company-details-chart__header">
                <span>{title}</span>
                <strong>
                  <span className="company-details-modal__shimmer company-details-modal__shimmer--chart-value" />
                </strong>
              </div>
              <div className="company-details-chart__canvas company-details-chart__canvas--loading">
                <span className="company-details-modal__chart-bar company-details-modal__chart-bar--one" />
                <span className="company-details-modal__chart-bar company-details-modal__chart-bar--two" />
                <span className="company-details-modal__chart-bar company-details-modal__chart-bar--three" />
                <span className="company-details-modal__chart-bar company-details-modal__chart-bar--four" />
              </div>
            </div>
          ))}
        </div>

        <div className="company-details-modal__table-wrap">
          <table className="company-details-modal__table company-details-modal__table--wide">
            <thead>
              <tr>
                <th>Breakdown</th>
                {statementSkeletonColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statementSkeletonRows.map((label, rowIndex) => (
                <tr key={label}>
                  <td>{label}</td>
                  {statementSkeletonColumns.map((column, columnIndex) => (
                    <td key={`${label}-${column}`}>
                      <span className={`company-details-modal__shimmer company-details-modal__shimmer--value company-details-modal__shimmer--cell${(rowIndex + columnIndex) % 3}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompanyDetailsModal({ open, stock, analysis, onClose }) {
  const [profile, setProfile] = useState(null);
  const [financialDetails, setFinancialDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open || !stock?.ticker) {
      return;
    }

    let isActive = true;

    queueMicrotask(() => {
      if (isActive) {
        setLoading(true);
        setError("");
        setProfile(null);
        setFinancialDetails(null);
      }
    });

    Promise.allSettled([
      getCompanyProfile(stock.ticker),
      getFinancialDetails(stock.ticker)
    ])
      .then(([profileResult, financialDetailsResult]) => {
        if (isActive) {
          if (profileResult.status === "fulfilled") {
            setProfile(profileResult.value);
          }

          if (financialDetailsResult.status === "fulfilled") {
            setFinancialDetails(financialDetailsResult.value);
          }

          if (
            profileResult.status === "rejected" &&
            financialDetailsResult.status === "rejected"
          ) {
            throw new Error("Could not load company details from available providers.");
          }
        }
      })
      .catch((fetchError) => {
        if (isActive) {
          console.error(`Could not load company details for ${stock.ticker}:`, fetchError);
          setProfile(null);
          setError(fetchError.message || "Could not load company details.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [open, stock?.ticker]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return undefined;
    }

    const panel = panelRef.current;
    let lastTouchY = 0;

    const shouldStopBoundaryScroll = (deltaY) => {
      const canScroll = panel.scrollHeight > panel.clientHeight;
      const isAtTop = panel.scrollTop <= 0;
      const isAtBottom =
        Math.ceil(panel.scrollTop + panel.clientHeight) >= panel.scrollHeight;

      return (
        !canScroll ||
        (deltaY < 0 && isAtTop) ||
        (deltaY > 0 && isAtBottom)
      );
    };

    const handleWheel = (event) => {
      if (shouldStopBoundaryScroll(event.deltaY)) {
        event.preventDefault();
      }

      event.stopPropagation();
    };

    const handleTouchStart = (event) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event) => {
      const nextTouchY = event.touches[0]?.clientY ?? lastTouchY;
      const deltaY = lastTouchY - nextTouchY;
      lastTouchY = nextTouchY;

      if (shouldStopBoundaryScroll(deltaY)) {
        event.preventDefault();
      }

      event.stopPropagation();
    };

    panel.addEventListener("wheel", handleWheel, { passive: false });
    panel.addEventListener("touchstart", handleTouchStart, { passive: true });
    panel.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      panel.removeEventListener("wheel", handleWheel);
      panel.removeEventListener("touchstart", handleTouchStart);
      panel.removeEventListener("touchmove", handleTouchMove);
    };
  }, [open]);

  const statementColumns = useMemo(() => {
    const annualStatements = financialDetails?.incomeStatements || [];
    const ttmStatement = financialDetails?.ttmIncomeStatement;

    return ttmStatement
      ? [...annualStatements, ttmStatement]
      : annualStatements;
  }, [financialDetails]);

  if (!open || !stock) {
    return null;
  }

  const { displayName, website, logo } = getCompanyDisplayData({
    stock,
    profile,
    financialDetails
  });
  const showInitialLoading = loading && !profile && !financialDetails;

  return (
    <div className="company-details-modal" role="dialog" aria-modal="true" aria-labelledby="company-details-title" aria-busy={loading}>
      <button className="company-details-modal__backdrop" type="button" aria-label="Close details" onClick={onClose} />

      <section className="company-details-modal__panel" ref={panelRef}>
        <header className="company-details-modal__header">
          <div className="company-details-modal__identity">
            {logo ? (
              <img src={logo} alt="" className="company-details-modal__logo" />
            ) : (
              <span className="company-details-modal__logo company-details-modal__logo--fallback">
                {stock.ticker?.slice(0, 1)}
              </span>
            )}
            <div>
              <span className="company-details-modal__ticker">{stock.ticker}</span>
              <h2 id="company-details-title">{displayName}</h2>
            </div>
          </div>

          <button className="company-details-modal__close" type="button" onClick={onClose} aria-label="Close company details">
            x
          </button>
        </header>

        {showInitialLoading ? (
          <CompanyDetailsSkeleton />
        ) : (
          <>
            <CompanyDetailsSummary
              stock={stock}
              profile={profile}
              analysis={analysis}
              financialDetails={financialDetails}
            />

            {loading && <p className="company-details-modal__state">Refreshing latest company profile...</p>}
            {error && <p className="company-details-modal__state company-details-modal__state--error">{error}</p>}

            <CompanyDetailsBreakdown
              stock={stock}
              profile={profile}
              analysis={analysis}
              financialDetails={financialDetails}
            />

            <IncomeStatementTable statements={statementColumns} />

            {getSafeExternalUrl(website) && (
              <a className="company-details-modal__website" href={getSafeExternalUrl(website)} target="_blank" rel="noopener noreferrer">
                Visit company website
              </a>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default CompanyDetailsModal;
