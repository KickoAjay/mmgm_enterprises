import { z } from "zod";

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? Number(v) : null));

export const productFormSchema = z.object({
  sku: z.string().trim().min(2, "Enter a SKU"),
  name: z.string().trim().min(2, "Enter a product name"),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  categoryId: optionalUuid,
  fabricId: optionalUuid,
  materialId: optionalUuid,
  brand: z.string().trim().min(1, "Enter a brand").default("MMGM Enterprises"),
  description: optionalText,
  shortDescription: optionalText,
  originalPrice: z.coerce.number().min(0, "Enter a valid price"),
  sellingPrice: z.coerce.number().min(0, "Enter a valid price"),
  sareeLengthMeters: optionalNumber,
  blousePieceIncluded: z.string().optional(),
  blouseLengthMeters: optionalNumber,
  primaryColorId: optionalUuid,
  secondaryColorId: optionalUuid,
  patternId: optionalUuid,
  design: optionalText,
  borderType: optionalText,
  borderColor: optionalText,
  palluType: optionalText,
  workType: optionalText,
  weaveType: optionalText,
  washCare: optionalText,
  countryOfOrigin: z.string().trim().min(1).default("India"),
  weightGrams: optionalNumber,
  returnEligible: z.string().optional(),
  returnPeriodDays: z.coerce.number().int().min(0).default(7),
  status: z.enum(["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"]),
  stockQuantity: z.coerce.number().int().min(0, "Enter a valid stock quantity"),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
