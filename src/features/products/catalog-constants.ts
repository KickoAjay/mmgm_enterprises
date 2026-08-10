// Client-safe catalog constants/types — split out from catalog.ts (which
// is "server-only") so client components like catalog-sort.tsx can import
// SORT_OPTIONS etc. without pulling the DB-querying code into the browser
// bundle.
import type { ProductListItem } from "@/features/products/queries";

export type SortOption =
  | "recommended"
  | "newest"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "discount", label: "Biggest Discount" },
];

export const PAGE_SIZE = 12;

export const PRICE_BANDS: {
  key: string;
  label: string;
  min: number;
  max: number | null;
}[] = [
  { key: "under-999", label: "Under ₹999", min: 0, max: 999 },
  { key: "1000-2499", label: "₹1,000–₹2,499", min: 1000, max: 2499 },
  { key: "2500-4999", label: "₹2,500–₹4,999", min: 2500, max: 4999 },
  { key: "5000-9999", label: "₹5,000–₹9,999", min: 5000, max: 9999 },
  { key: "10000-plus", label: "₹10,000+", min: 10000, max: null },
];

export const DISCOUNT_BANDS = [10, 20, 30, 50];

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  fabric?: string; // comma-separated names
  color?: string; // comma-separated names
  pattern?: string; // comma-separated names
  occasion?: string; // comma-separated names
  price?: string; // PRICE_BANDS key
  discount?: string; // one of DISCOUNT_BANDS
  availability?: string; // "in-stock" | "out-of-stock"
  sort?: string;
  page?: string;
};

export type CatalogProduct = ProductListItem & { isAvailable: boolean | null };

export type FilterOptions = {
  categories: { id: string; name: string; slug: string }[];
  fabrics: { id: string; name: string }[];
  colors: { id: string; name: string; hex_code: string | null }[];
  patterns: { id: string; name: string }[];
  occasions: { id: string; name: string }[];
};

export type CatalogResult = {
  items: CatalogProduct[];
  totalCount: number;
  page: number;
  pageCount: number;
  filterOptions: FilterOptions;
};
