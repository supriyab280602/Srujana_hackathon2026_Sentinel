/**
 * Sentinel Financial Data & Currency Formatting Utilities
 * Standardized on Indian Rupee (INR - ₹) and locale-aware number representation.
 */

/**
 * Format a number into Indian Rupee (INR) currency string.
 * Uses en-IN locale numbering system (e.g., ₹4,85,200).
 */
export const formatINR = (
  amount: number | undefined | null,
  options?: {
    decimals?: number;
    compact?: boolean;
  }
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const decimals = options?.decimals ?? 0;

  if (options?.compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 10000000) {
      // Crores
      return `${sign}₹${(abs / 10000000).toFixed(decimals > 0 ? decimals : 2)} Cr`;
    }
    if (abs >= 100000) {
      // Lakhs
      return `${sign}₹${(abs / 100000).toFixed(decimals > 0 ? decimals : 2)} L`;
    }
    if (abs >= 1000) {
      // Thousands
      return `${sign}₹${(abs / 1000).toFixed(decimals > 0 ? decimals : 1)} k`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format raw numbers with Indian comma separation (e.g., 4,85,200).
 */
export const formatNumberINR = (
  value: number | undefined | null,
  decimals: number = 0
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage with consistent precision and sign.
 */
export const formatPercent = (
  value: number,
  includeSign: boolean = false
): string => {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Standardize timestamp presentation for audit scanning.
 */
export const formatAuditTimestamp = (isoOrDateStr: string): string => {
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoOrDateStr;
  }
};
