import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";

// lucide-react's brand/social icons (Instagram, Facebook, YouTube) were
// removed in this major version, so social links use plain text instead.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "YouTube", href: "https://youtube.com" },
];

const SHOP_LINKS = [
  { label: "Sarees", href: "/sarees" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=best-selling" },
  { label: "Collections", href: "/collections" },
  { label: "Offers", href: "/offers" },
];

const CARE_LINKS = [
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/account/returns" },
  { label: "Refunds", href: "/account/refunds" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-meta font-semibold tracking-wide text-foreground uppercase">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-meta text-muted-foreground hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <span className="font-serif text-lg text-foreground">
            MMGM ENTERPRISES
          </span>
          <p className="text-meta mt-3 text-muted-foreground">
            Premium sarees for every occasion — modern Indian fashion, handloom
            heritage, digital-first boutique.
          </p>
        </div>

        <FooterColumn title="Shop" links={SHOP_LINKS} />
        <FooterColumn title="Customer Care" links={CARE_LINKS} />
        <FooterColumn title="Policies" links={POLICY_LINKS} />

        <div>
          <h3 className="text-meta font-semibold tracking-wide text-foreground uppercase">
            Follow Us
          </h3>
          <div className="text-meta mt-4 flex flex-col gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                className="text-muted-foreground hover:text-primary"
              >
                {social.label}
              </a>
            ))}
          </div>

          <div className="text-meta mt-6 flex flex-col gap-2 text-muted-foreground">
            <a
              href="mailto:care@mmgmenterprises.com"
              className="flex items-center gap-2 hover:text-primary"
            >
              <Mail className="size-4" /> care@mmgmenterprises.com
            </a>
            <a
              href="tel:+911234567890"
              className="flex items-center gap-2 hover:text-primary"
            >
              <Phone className="size-4" /> +91 12345 67890
            </a>
            <a
              href="https://wa.me/911234567890"
              className="flex items-center gap-2 hover:text-primary"
            >
              <MessageCircle className="size-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="text-meta mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} MMGM Enterprises. All rights reserved.
          </span>
          <div className="flex items-center gap-3">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-sm border border-border px-2 py-1"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
