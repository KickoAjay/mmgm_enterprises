"use client";

import { useActionState, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/features/products/admin-actions";
import type { AdminProductDetail, ProductFormOptions } from "@/features/products/admin-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

const inputClass =
  "border border-border bg-background px-3 py-2 text-sm text-foreground";

function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={inputClass} />;
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={inputClass}>
      {children}
    </select>
  );
}

export function ProductForm({
  options,
  product,
}: {
  options: ProductFormOptions;
  product?: AdminProductDetail;
}) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState<ProductActionState, FormData>(
    action,
    null,
  );

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    product?.occasionIds ?? [],
  );

  function toggleOccasion(id: string) {
    setSelectedOccasions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id],
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-10">
      {isEdit && product ? <input type="hidden" name="productId" value={product.id} /> : null}

      <section>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Basic Info
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Product Name" htmlFor="name">
            <TextInput
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Slug" htmlFor="slug">
            <TextInput
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="SKU" htmlFor="sku">
            <TextInput id="sku" name="sku" required defaultValue={product?.sku} />
          </Field>
          <Field label="Brand" htmlFor="brand">
            <TextInput
              id="brand"
              name="brand"
              defaultValue={product?.brand ?? "MMGM Enterprises"}
            />
          </Field>
          <Field label="Category" htmlFor="categoryId">
            <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}>
              <option value="">—</option>
              {options.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} required>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <Field label="Short Description" htmlFor="shortDescription">
            <TextInput
              id="shortDescription"
              name="shortDescription"
              defaultValue={product?.shortDescription ?? ""}
            />
          </Field>
          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Pricing &amp; Stock
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Original Price (₹)" htmlFor="originalPrice">
            <TextInput
              id="originalPrice"
              name="originalPrice"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product?.originalPrice}
            />
          </Field>
          <Field label="Selling Price (₹)" htmlFor="sellingPrice">
            <TextInput
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product?.sellingPrice}
            />
          </Field>
          <Field label="Stock Quantity" htmlFor="stockQuantity">
            <TextInput
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min={0}
              required
              defaultValue={product?.stockQuantity ?? 0}
            />
          </Field>
          <Field label="Low Stock Threshold" htmlFor="lowStockThreshold">
            <TextInput
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min={0}
              defaultValue={product?.lowStockThreshold ?? 5}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Saree Details
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Fabric" htmlFor="fabricId">
            <Select id="fabricId" name="fabricId" defaultValue={product?.fabricId ?? ""}>
              <option value="">—</option>
              {options.fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Material" htmlFor="materialId">
            <Select id="materialId" name="materialId" defaultValue={product?.materialId ?? ""}>
              <option value="">—</option>
              {options.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pattern" htmlFor="patternId">
            <Select id="patternId" name="patternId" defaultValue={product?.patternId ?? ""}>
              <option value="">—</option>
              {options.patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Primary Color" htmlFor="primaryColorId">
            <Select
              id="primaryColorId"
              name="primaryColorId"
              defaultValue={product?.primaryColorId ?? ""}
            >
              <option value="">—</option>
              {options.colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Secondary Color" htmlFor="secondaryColorId">
            <Select
              id="secondaryColorId"
              name="secondaryColorId"
              defaultValue={product?.secondaryColorId ?? ""}
            >
              <option value="">—</option>
              {options.colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Design" htmlFor="design">
            <TextInput id="design" name="design" defaultValue={product?.design ?? ""} />
          </Field>
          <Field label="Border Type" htmlFor="borderType">
            <TextInput id="borderType" name="borderType" defaultValue={product?.borderType ?? ""} />
          </Field>
          <Field label="Border Color" htmlFor="borderColor">
            <TextInput
              id="borderColor"
              name="borderColor"
              defaultValue={product?.borderColor ?? ""}
            />
          </Field>
          <Field label="Pallu Type" htmlFor="palluType">
            <TextInput id="palluType" name="palluType" defaultValue={product?.palluType ?? ""} />
          </Field>
          <Field label="Work Type" htmlFor="workType">
            <TextInput id="workType" name="workType" defaultValue={product?.workType ?? ""} />
          </Field>
          <Field label="Weave Type" htmlFor="weaveType">
            <TextInput id="weaveType" name="weaveType" defaultValue={product?.weaveType ?? ""} />
          </Field>
          <Field label="Wash Care" htmlFor="washCare">
            <TextInput id="washCare" name="washCare" defaultValue={product?.washCare ?? ""} />
          </Field>
          <Field label="Saree Length (m)" htmlFor="sareeLengthMeters">
            <TextInput
              id="sareeLengthMeters"
              name="sareeLengthMeters"
              type="number"
              step="0.01"
              defaultValue={product?.sareeLengthMeters ?? ""}
            />
          </Field>
          <Field label="Blouse Length (m)" htmlFor="blouseLengthMeters">
            <TextInput
              id="blouseLengthMeters"
              name="blouseLengthMeters"
              type="number"
              step="0.01"
              defaultValue={product?.blouseLengthMeters ?? ""}
            />
          </Field>
          <Field label="Weight (g)" htmlFor="weightGrams">
            <TextInput
              id="weightGrams"
              name="weightGrams"
              type="number"
              defaultValue={product?.weightGrams ?? ""}
            />
          </Field>
          <Field label="Country of Origin" htmlFor="countryOfOrigin">
            <TextInput
              id="countryOfOrigin"
              name="countryOfOrigin"
              defaultValue={product?.countryOfOrigin ?? "India"}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="blousePieceIncluded"
            defaultChecked={product?.blousePieceIncluded ?? false}
            className="size-4"
          />
          Blouse piece included
        </label>
      </section>

      <section>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Occasions
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {options.occasions.map((occasion) => (
            <label key={occasion.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="occasionIds"
                value={occasion.id}
                checked={selectedOccasions.includes(occasion.id)}
                onChange={() => toggleOccasion(occasion.id)}
                className="size-4"
              />
              {occasion.name}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-meta font-semibold tracking-wide text-foreground uppercase">
          Return Policy
        </h2>
        <div className="mt-4 flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="returnEligible"
              defaultChecked={product?.returnEligible ?? true}
              className="size-4"
            />
            Return eligible
          </label>
          <Field label="Return Period (days)" htmlFor="returnPeriodDays">
            <TextInput
              id="returnPeriodDays"
              name="returnPeriodDays"
              type="number"
              min={0}
              defaultValue={product?.returnPeriodDays ?? 7}
            />
          </Field>
        </div>
      </section>

      {state && "error" in state ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state && "success" in state ? (
        <p className="text-sm text-foreground">Saved.</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-fit uppercase tracking-wide">
        {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}
