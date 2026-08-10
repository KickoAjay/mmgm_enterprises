export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPercent(originalPrice: number, sellingPrice: number) {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}
