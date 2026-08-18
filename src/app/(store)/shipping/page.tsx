export const metadata = {
  title: "Shipping & Delivery",
  description: "Shipping, delivery, and return information for MMGM Enterprises orders.",
};

export default function ShippingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Shipping &amp; Delivery</h1>

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="font-serif text-lg text-foreground">Delivery Timelines</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Delivery estimates are shown on every product page based on your pincode. Most orders
            are dispatched within 1–2 business days of payment confirmation, with delivery
            typically following within 3–7 business days depending on your location.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">Order Tracking</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Once your order ships, you can track its status from your account&apos;s order history,
            or via the Track Order page using your order number and email/phone.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">Shipping Charges</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Shipping charges, if any, are calculated at checkout and shown before you place your
            order — there are no hidden fees.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-foreground">Returns &amp; Refunds</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Since our sarees are premium refurbished pieces, eligibility for return varies by
            product and is shown clearly on the product page. Approved returns are picked up and
            refunded to your original payment method after a quality check. Start a return from
            your account&apos;s order history, or reach out via our Contact page for help.
          </p>
        </section>
      </div>
    </main>
  );
}
