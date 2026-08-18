export const metadata = {
  title: "Cookie Policy",
  description: "How MMGM Enterprises uses cookies.",
};

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "What Are Cookies",
    body: "Cookies are small text files stored on your device that help websites function properly and remember your preferences between visits.",
  },
  {
    heading: "How We Use Cookies",
    body: "We use essential cookies to keep you signed in, remember items in your cart, and keep your session secure. We do not use cookies for third-party advertising.",
  },
  {
    heading: "Managing Cookies",
    body: "Most browsers let you control or delete cookies through their settings. Note that disabling essential cookies may prevent parts of the site — like staying signed in or checking out — from working correctly.",
  },
  {
    heading: "Contact Us",
    body: "Questions about our use of cookies? Reach out via our Contact page or email us directly — details are in the footer of every page.",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Cookie Policy</h1>
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
