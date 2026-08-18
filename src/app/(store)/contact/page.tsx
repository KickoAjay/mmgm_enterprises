import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import {
  COMPANY_ADDRESS_LINES,
  COMPANY_EMAIL,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_TEL,
} from "@/lib/constants";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with MMGM Enterprises — questions, order help, or feedback.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-section text-foreground">Contact Us</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Questions about an order, a saree, or our quality-checked refurbishment process? Send us a
        message and our team will get back to you.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-5">
          <a
            href={`mailto:${COMPANY_EMAIL}`}
            className="flex items-start gap-3 text-sm text-foreground hover:text-primary"
          >
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="break-all">{COMPANY_EMAIL}</span>
          </a>
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="flex items-start gap-3 text-sm text-foreground hover:text-primary"
          >
            <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{COMPANY_PHONE_DISPLAY}</span>
          </a>
          <div className="flex items-start gap-3 text-sm text-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {COMPANY_ADDRESS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div className="border border-border bg-background p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
