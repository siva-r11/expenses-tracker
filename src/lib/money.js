export function roundMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

export function parseAmount(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return roundMoney(value);
  }
  const cleaned = String(value ?? '').replace(/[\u20B9$,\s]/g, '').trim();
  if (!cleaned || cleaned === '.' || cleaned === '-' || cleaned === '+') return null;
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return null;
  return roundMoney(number);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(value));
}

export function formatMoneyCompact(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(roundMoney(value));
}

// Plain-text rupee format for PDF output. The PDF's built-in font has no ₹ glyph.
export function formatMoneyPlain(value) {
  const rounded = roundMoney(value);
  const body = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rounded));
  return `${rounded < 0 ? '-' : ''}Rs. ${body}`;
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}
