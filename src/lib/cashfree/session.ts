import "server-only";
import { createServiceClient } from "@/lib/db/service";
import {
  createCashfreeOrder,
  getCashfreeOrder,
  getCashfreeConfig,
} from "@/lib/cashfree/client";
import {
  formatCashfreeAmount,
  formatCashfreeEmail,
  formatCashfreePhone,
} from "@/lib/cashfree/customer";

const RESUMABLE_STATUSES = new Set(["ACTIVE", "PENDING"]);

export type EnsurePaymentSessionParams = {
  dbOrderId: string;
  cashfreeOrderId: string;
  orderNumber: string;
  amount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
};

export type EnsurePaymentSessionResult = {
  paymentSessionId: string;
  cashfreeOrderId: string;
  mode: "sandbox" | "production";
};

function buildCreateParams(
  params: EnsurePaymentSessionParams,
  cashfreeOrderId: string,
) {
  const phone = formatCashfreePhone(params.customerPhone);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error(
      `Invalid customer phone for Cashfree (${params.customerPhone})`,
    );
  }

  return {
    orderId: cashfreeOrderId,
    amount: formatCashfreeAmount(params.amount),
    customerId: params.customerId,
    customerName: params.customerName.trim() || "Customer",
    customerEmail: formatCashfreeEmail(params.customerEmail, params.orderNumber),
    customerPhone: phone,
    returnUrl: params.returnUrl,
  };
}

async function updateCashfreeOrderId(
  dbOrderId: string,
  cashfreeOrderId: string,
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("payments")
    .update({ cashfree_order_id: cashfreeOrderId })
    .eq("order_id", dbOrderId);
}

export async function ensureCashfreePaymentSession(
  params: EnsurePaymentSessionParams,
): Promise<EnsurePaymentSessionResult> {
  const { mode } = getCashfreeConfig();
  let cashfreeOrderId = params.cashfreeOrderId;

  const existing = await getCashfreeOrder(cashfreeOrderId);
  if (
    existing?.paymentSessionId &&
    existing.orderStatus &&
    RESUMABLE_STATUSES.has(existing.orderStatus)
  ) {
    return {
      paymentSessionId: existing.paymentSessionId,
      cashfreeOrderId,
      mode,
    };
  }

  try {
    const created = await createCashfreeOrder(
      buildCreateParams(params, cashfreeOrderId),
    );
    return {
      paymentSessionId: created.paymentSessionId,
      cashfreeOrderId,
      mode,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const orderExists =
      message.includes("(409)") || message.includes("order_already_exists");

    if (orderExists) {
      const retry = await getCashfreeOrder(cashfreeOrderId);
      if (
        retry?.paymentSessionId &&
        retry.orderStatus &&
        RESUMABLE_STATUSES.has(retry.orderStatus)
      ) {
        return {
          paymentSessionId: retry.paymentSessionId,
          cashfreeOrderId,
          mode,
        };
      }
    } else if (!orderExists) {
      throw err;
    }
  }

  // Expired or terminated Cashfree order — create a fresh one with a new id.
  cashfreeOrderId = `${params.orderNumber}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const created = await createCashfreeOrder(
    buildCreateParams(params, cashfreeOrderId),
  );
  await updateCashfreeOrderId(params.dbOrderId, cashfreeOrderId);

  return {
    paymentSessionId: created.paymentSessionId,
    cashfreeOrderId,
    mode,
  };
}
