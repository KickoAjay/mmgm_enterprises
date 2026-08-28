// Cashfree expects a 10-digit Indian mobile number without a country code.
export function formatCashfreePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits.slice(-10);
}

export function formatCashfreeEmail(email: string, orderNumber: string): string {
  const trimmed = email.trim();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  const safeOrder = orderNumber.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `order+${safeOrder}@customers.mmgm-enterprises.vercel.app`;
}

export function formatCashfreeAmount(amount: number): number {
  return Number(amount.toFixed(2));
}
