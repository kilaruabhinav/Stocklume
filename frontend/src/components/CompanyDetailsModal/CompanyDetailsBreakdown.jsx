import { Fragment } from "react";
import { buildDetailRows, formatMissing } from "./companyDetailsUtils";

function CompanyDetailsBreakdown({ stock, profile, analysis, financialDetails }) {
  const sections = buildDetailRows({ stock, profile, analysis, financialDetails });

  return (
    <div className="company-details-modal__table-wrap">
      <table className="company-details-modal__table">
        <thead>
          <tr>
            <th>Breakdown</th>
            <th>Latest Available</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <Fragment key={section.title}>
              <tr className="company-details-modal__section-row">
                <td colSpan="2">{section.title}</td>
              </tr>
              {section.rows.map(([label, value]) => (
                <tr key={`${section.title}-${label}`}>
                  <td>{label}</td>
                  <td>{formatMissing(value)}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompanyDetailsBreakdown;
