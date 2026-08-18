export const metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping with MMGM Enterprises.",
};

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "About Our Products",
    body: "MMGM Enterprises sells premium refurbished sarees. Each saree is inspected, cleaned, and quality-checked before being listed for sale. Product listings describe the item's condition honestly — by placing an order, you acknowledge you are purchasing a refurbished product, not a new one, unless a listing explicitly states otherwise.",
  },
  {
    heading: "Orders & Payment",
    body: "All orders are subject to product availability and confirmation of payment. Payments are processed securely through Cashfree. An order is confirmed only once payment has been successfully verified.",
  },
  {
    heading: "Pricing",
    body: "Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to correct pricing errors before an order is confirmed.",
  },
  {
    heading: "Shipping & Delivery",
    body: "Estimated delivery timelines are shown at checkout and on product pages. See our Shipping page for full details.",
  },
  {
    heading: "Returns & Refunds",
    body: "Return eligibility is shown on each product page. Approved returns are refunded to the original payment method after the returned item passes a quality check.",
  },
  {
    heading: "Account Responsibility",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
  },
  {
    heading: "Changes to These Terms",
    body: "We may update these terms from time to time. Continued use of the website after changes constitutes acceptance of the updated terms.",
  },
  {
    heading: "Contact Us",
    body: "Questions about these terms? Reach out via our Contact page or email us directly — details are in the footer of every page.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 2026</p>

      <div className="mt-8 flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-lg text-foreground">{section.heading}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
