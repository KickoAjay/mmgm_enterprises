import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { FilterOptions } from "@/features/products/catalog";
import { PRICE_BANDS, DISCOUNT_BANDS } from "@/features/products/catalog";
import {
  buildCatalogHref,
  toggleListValue,
  parseListParam,
} from "@/features/products/catalog-url";
import { cn } from "@/lib/utils";

const AVAILABILITY_OPTIONS = [
  { key: "in-stock", label: "In Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
];

const FILTER_PARAM_KEYS = [
  "fabric",
  "color",
  "pattern",
  "occasion",
  "price",
  "discount",
  "availability",
];

function hasActiveFilters(current: Record<string, string | undefined>) {
  return FILTER_PARAM_KEYS.some((key) => Boolean(current[key]));
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0">
      <h3 className="text-meta font-semibold tracking-wide text-foreground uppercase">
        {title}
      </h3>
      <div className="mt-3 flex flex-col">{children}</div>
    </div>
  );
}

function CheckboxLink({
  href,
  checked,
  label,
}: {
  href: string;
  checked: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 py-1.5 text-sm text-foreground hover:text-primary"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border",
        )}
      >
        {checked ? <Check className="size-3" /> : null}
      </span>
      {label}
    </Link>
  );
}

export function FilterSidebar({
  basePath,
  current,
  filterOptions,
}: {
  basePath: string;
  current: Record<string, string | undefined>;
  filterOptions: FilterOptions;
}) {
  const selectedFabrics = parseListParam(current.fabric);
  const selectedColors = parseListParam(current.color);
  const selectedPatterns = parseListParam(current.pattern);
  const selectedOccasions = parseListParam(current.occasion);

  return (
    <div>
      <FilterSection title="Price">
        {PRICE_BANDS.map((band) => {
          const checked = current.price === band.key;
          const href = buildCatalogHref(basePath, current, {
            price: checked ? null : band.key,
          });
          return (
            <CheckboxLink
              key={band.key}
              href={href}
              checked={checked}
              label={band.label}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Fabric">
        {filterOptions.fabrics.map((fabric) => {
          const checked = selectedFabrics.includes(fabric.name);
          const href = buildCatalogHref(basePath, current, {
            fabric: toggleListValue(current.fabric, fabric.name),
          });
          return (
            <CheckboxLink
              key={fabric.id}
              href={href}
              checked={checked}
              label={fabric.name}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-3">
          {filterOptions.colors.map((color) => {
            const checked = selectedColors.includes(color.name);
            const href = buildCatalogHref(basePath, current, {
              color: toggleListValue(current.color, color.name),
            });
            return (
              <Link
                key={color.id}
                href={href}
                title={color.name}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "block size-6 rounded-full border",
                    checked
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border",
                  )}
                  style={{ backgroundColor: color.hex_code ?? undefined }}
                />
              </Link>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Occasion">
        {filterOptions.occasions.map((occasion) => {
          const checked = selectedOccasions.includes(occasion.name);
          const href = buildCatalogHref(basePath, current, {
            occasion: toggleListValue(current.occasion, occasion.name),
          });
          return (
            <CheckboxLink
              key={occasion.id}
              href={href}
              checked={checked}
              label={occasion.name}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Pattern">
        {filterOptions.patterns.map((pattern) => {
          const checked = selectedPatterns.includes(pattern.name);
          const href = buildCatalogHref(basePath, current, {
            pattern: toggleListValue(current.pattern, pattern.name),
          });
          return (
            <CheckboxLink
              key={pattern.id}
              href={href}
              checked={checked}
              label={pattern.name}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Discount">
        {DISCOUNT_BANDS.map((min) => {
          const checked = current.discount === String(min);
          const href = buildCatalogHref(basePath, current, {
            discount: checked ? null : String(min),
          });
          return (
            <CheckboxLink
              key={min}
              href={href}
              checked={checked}
              label={`${min}%+`}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Availability">
        {AVAILABILITY_OPTIONS.map((opt) => {
          const checked = current.availability === opt.key;
          const href = buildCatalogHref(basePath, current, {
            availability: checked ? null : opt.key,
          });
          return (
            <CheckboxLink
              key={opt.key}
              href={href}
              checked={checked}
              label={opt.label}
            />
          );
        })}
      </FilterSection>

      {hasActiveFilters(current) ? (
        <Link
          href={buildCatalogHref(basePath, current, {
            fabric: null,
            color: null,
            pattern: null,
            occasion: null,
            price: null,
            discount: null,
            availability: null,
          })}
          className="text-meta mt-4 inline-block text-primary underline-offset-4 hover:underline"
        >
          Clear all filters
        </Link>
      ) : null}
    </div>
  );
}
