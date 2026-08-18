export const metadata = {
  title: "Privacy Policy",
  description: "How MMGM Enterprises collects, uses, and protects your information.",
};

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Information We Collect",
    body: "When you create an account, place an order, or contact us, we collect information such as your name, email address, mobile number, shipping address, and order details. Payment details are handled directly by our payment partner, Cashfree, and are never stored on our servers.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use your information to process and deliver orders, send order/payment/shipping updates, respond to support requests, and improve our products and service. We do not sell your personal information to third parties.",
  },
  {
    heading: "Order & Account Data",
    body: "Your order history, saved addresses, and wishlist are stored securely and are only accessible to you and authorized MMGM Enterprises staff for the purpose of fulfilling and supporting your orders.",
  },
  {
    heading: "Cookies",
    body: "We use essential cookies to keep you signed in and remember your cart. See our Cookie Policy for details.",
  },
  {
    heading: "Data Security",
    body: "We use industry-standard security practices, including encrypted connections (HTTPS) and access controls, to protect your information from unauthorized access.",
  },
  {
    heading: "Your Rights",
    body: "You can review or update your account details at any time from your account page, or contact us to request deletion of your data, subject to legal/accounting retention requirements.",
  },
  {
    heading: "Contact Us",
    body: "For any privacy-related questions, reach out via our Contact page or email us directly — details are in the footer of every page.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Privacy Policy</h1>
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
