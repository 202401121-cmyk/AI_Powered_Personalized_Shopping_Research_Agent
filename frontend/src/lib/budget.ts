export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type BudgetParseResult =
  | { ok: true; amount: number | null }
  | { ok: false; message: string };

/**
 * Parse a budget the way a shopper would type it: 70000, 70k, 1.5 lakh, ₹70,000.
 * Empty input means "no budget", which ShopSense must not assume.
 */
export function parseBudgetInr(raw: string): BudgetParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, amount: null };
  }

  const normalised = trimmed.replace(/₹/g, "").replace(/,/g, "").trim().toLowerCase();

  const lakhMatch = normalised.match(/^(\d+(?:\.\d+)?)\s*lakhs?$/);
  if (lakhMatch) {
    return positiveAmount(parseFloat(lakhMatch[1]) * 100_000);
  }

  const kMatch = normalised.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (kMatch) {
    return positiveAmount(parseFloat(kMatch[1]) * 1_000);
  }

  if (!/^\d+(?:\.\d+)?$/.test(normalised)) {
    return {
      ok: false,
      message: "Enter a whole number in rupees, or use k or lakh",
    };
  }

  return positiveAmount(Number(normalised));
}

function positiveAmount(value: number): BudgetParseResult {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, message: "Budget must be greater than 0" };
  }
  return { ok: true, amount: Math.round(value) };
}

/** Pull a budget out of a free-text request, or return null if none was stated. */
export function detectBudgetFromQuery(query: string): number | null {
  const lower = query.toLowerCase();
  const match =
    lower.match(/under\s+₹?\s*([\d,.]+\s*(?:k|lakhs?)?)/i) ??
    lower.match(/₹\s*([\d,]+(?:\.\d+)?)/) ??
    lower.match(/([\d.]+\s*(?:k|lakhs?))/i);

  if (!match) {
    return null;
  }

  const parsed = parseBudgetInr(match[1]);
  return parsed.ok ? parsed.amount : null;
}
