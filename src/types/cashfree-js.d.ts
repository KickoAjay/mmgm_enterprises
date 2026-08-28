declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export type CashfreeCheckoutResult = {
    error?: { message?: string; type?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  };

  export type CashfreeInstance = {
    checkout: (options: {
      paymentSessionId: string;
      redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
    }) => Promise<CashfreeCheckoutResult>;
  };

  export function load(options: {
    mode: CashfreeMode;
  }): Promise<CashfreeInstance>;
}
