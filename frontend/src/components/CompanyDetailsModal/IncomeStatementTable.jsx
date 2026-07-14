import { buildIncomeStatementRows, formatStatementValue } from "./companyDetailsUtils";
import FinancialBarCharts from "./FinancialBarCharts";

function IncomeStatementTable({ statements }) {
  const statementRows = buildIncomeStatementRows(statements);

  if (statements.length === 0 || statementRows.length === 0) {
    return null;
  }

  return (
    <div className="company-details-modal__statement">
      <div className="company-details-modal__statement-header">
        <div>
          <span>Financials</span>
          <strong>Income Statement</strong>
        </div>
        <p>Annual periods with TTM when quarterly data is available.</p>
      </div>

      <FinancialBarCharts statements={statements} />

      <div className="company-details-modal__table-wrap">
        <table className="company-details-modal__table company-details-modal__table--wide">
          <thead>
            <tr>
              <th>Breakdown</th>
              {statements.map((statement) => (
                <th key={statement.date}>{statement.date}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statementRows.map(([label, key, type]) => (
              <tr key={key}>
                <td>{label}</td>
                {statements.map((statement) => (
                  <td key={`${statement.date}-${key}`}>
                    {formatStatementValue(statement[key], type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IncomeStatementTable;
