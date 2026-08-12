export const COLORS = {
  BRAND: "#7A1830",
  TEXT: "#171717",
  MUTED: "#666666",
  BORDER: "#EAEAEA",
  SOFT_BG: "#F7F7F5",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Shared wrapper so every transactional email (order/payment confirmation,
// welcome, admin alerts, status updates) reads as one consistent brand
// rather than five one-off templates — plain inline styles only, no CSS
// classes, since email clients strip <style> blocks unpredictably.
export function emailShell(bodyHtml: string): string {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:${COLORS.SOFT_BG};padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border:1px solid ${COLORS.BORDER};padding:32px;">
      ${bodyHtml}
      <p style="color:${COLORS.MUTED};font-size:12px;margin-top:32px;">MMGM Enterprises</p>
    </div>
  </div>`;
}

export function summaryRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:4px 0;color:${COLORS.MUTED};font-size:13px;">${label}</td>
      <td style="padding:4px 0;color:${COLORS.TEXT};font-size:13px;text-align:right;">${value}</td>
    </tr>`;
}

export function formatEmailDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function ctaButton(label: string, href: string): string {
  return `
    <table style="margin:24px 0;">
      <tr>
        <td style="border-radius:2px;background:${COLORS.BRAND};">
          <a href="${href}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;text-decoration:none;letter-spacing:0.03em;">${label}</a>
        </td>
      </tr>
    </table>`;
}
