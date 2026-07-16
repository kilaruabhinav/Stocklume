const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? currencyFormatter.format(number) : "N/A";
}

export function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}%` : "N/A";
}

export function formatQuantity(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4
  }).format(number);
}

export function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function getProfitLossClass(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number === 0) {
    return "portfolio-profit-loss--neutral";
  }

  return number > 0
    ? "portfolio-profit-loss--positive"
    : "portfolio-profit-loss--negative";
}
