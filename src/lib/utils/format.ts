export function formatEUR(value: number | null | undefined) {
  if (value === null || value === undefined) return "€0.00";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatRMB(value: number | null | undefined) {
  if (value === null || value === undefined) return "¥0.00";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-IE", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}
