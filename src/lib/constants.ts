// Single source of truth for company contact details — used in the
// footer, the /contact page, and anywhere else the site displays or
// emails using this information. Keeping it in one place means a future
// change (new address, new number) never drifts out of sync between
// pages the way three hardcoded copies would.
export const COMPANY_NAME = "MMGM Enterprises";
export const COMPANY_EMAIL = "mmgmenterprises.office@gmail.com";
export const COMPANY_PHONE_DISPLAY = "+91 95663 08123";
export const COMPANY_PHONE_TEL = "+919566308123";
export const COMPANY_ADDRESS_LINES = [
  "13 Upstairs, Nabigal Nayagam Street",
  "Tirunelveli, Tamil Nadu – 627006",
];
export const COMPANY_ADDRESS = COMPANY_ADDRESS_LINES.join(", ");
