import { z } from "zod";

const fullName = z.string().trim().min(2, "Enter full name");
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const pincode = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode");
const line1 = z.string().trim().min(3, "Enter address line 1");
const cityOrState = z.string().trim().min(2, "This field is required");

export const addressFieldsSchema = z.object({
  fullName,
  phone,
  line1,
  line2: z.string().trim().optional().or(z.literal("")),
  city: cityOrState,
  state: cityOrState,
  pincode,
});

export type AddressFields = z.infer<typeof addressFieldsSchema>;

export const checkoutSchema = z.object({
  guestEmail: z.email("Enter a valid email address").optional().or(z.literal("")),
  shippingFullName: fullName,
  shippingPhone: phone,
  shippingLine1: line1,
  shippingLine2: z.string().trim().optional().or(z.literal("")),
  shippingCity: cityOrState,
  shippingState: cityOrState,
  shippingPincode: pincode,
  billingSameAsShipping: z.string().optional(),
  billingFullName: z.string().trim().optional().or(z.literal("")),
  billingPhone: z.string().trim().optional().or(z.literal("")),
  billingLine1: z.string().trim().optional().or(z.literal("")),
  billingLine2: z.string().trim().optional().or(z.literal("")),
  billingCity: z.string().trim().optional().or(z.literal("")),
  billingState: z.string().trim().optional().or(z.literal("")),
  billingPincode: z.string().trim().optional().or(z.literal("")),
  couponCode: z.string().trim().optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
