import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a category name"),
  slug: z
    .string()
    .trim()
    .min(2, "Enter a slug")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  imageUrl: optionalText,
  sortOrder: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : 0)),
  isActive: z.string().optional(),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
