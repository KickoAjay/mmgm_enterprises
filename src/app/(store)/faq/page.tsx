export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about MMGM Enterprises' refurbished sarees.",
};

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Are your sarees new?",
    answer:
      "MMGM Enterprises specializes in premium refurbished sarees. Every saree is carefully inspected, cleaned, and quality-checked before listing, so you get authentic, beautiful sarees at a more accessible price — not brand-new stock.",
  },
  {
    question: "What does \"refurbished\" mean here?",
    answer:
      "Refurbished means the saree has been previously owned, professionally cleaned and quality-checked, and any minor wear is clearly assessed before it's listed. We never list a saree that doesn't meet our quality standard.",
  },
  {
    question: "How do I know the condition of a saree before I buy it?",
    answer:
      "Every product page lists its condition and details honestly. If you have questions about a specific saree, reach out via our Contact page before ordering.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept UPI, major debit/credit cards, net banking, and popular wallets via Cashfree's secure checkout.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery timelines depend on your pincode — check the estimated delivery date shown on the product page, or track an existing order from the Track Order page.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Eligible sarees can be returned within the return window shown on the product page. Start a return from your account's order history, or see our Shipping page for details.",
  },
  {
    question: "How can I contact customer support?",
    answer: "Reach us anytime via the Contact page, by email, or by phone/WhatsApp — details are in the footer.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Frequently Asked Questions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you need to know about shopping quality-checked & refurbished sarees with us.
      </p>

      <div className="mt-8 flex flex-col divide-y divide-border border-t border-border">
        {FAQS.map((faq) => (
          <div key={faq.question} className="py-5">
            <h2 className="font-serif text-lg text-foreground">{faq.question}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
