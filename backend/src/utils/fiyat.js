function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function normalizeOptionalPrice(val) {
  if (val === undefined) return undefined;
  if (val === null || val === '') return null;
  return parseNumber(val);
}

function normalizeMoneyDefaultZero(val) {
  if (val === undefined) return undefined;
  if (val === null || val === '') return 0;
  return parseNumber(val) ?? 0;
}

function normalizeBiletPrices(data) {
  const next = { ...data };
  if ('satis_fiyati' in next) {
    next.satis_fiyati = normalizeOptionalPrice(next.satis_fiyati);
  }
  if ('alis_fiyati' in next) {
    next.alis_fiyati = normalizeOptionalPrice(next.alis_fiyati);
  }
  if ('teknede_odeme' in next) {
    next.teknede_odeme = normalizeMoneyDefaultZero(next.teknede_odeme);
  }
  return next;
}

module.exports = {
  parseNumber,
  normalizeOptionalPrice,
  normalizeMoneyDefaultZero,
  normalizeBiletPrices,
};
