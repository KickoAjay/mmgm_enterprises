import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, jsonLdScript, productJsonLd } from "./structured-data";

describe("jsonLdScript", () => {
  it("serializes plain data to JSON", () => {
    expect(jsonLdScript({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  it("escapes '<' so a value can't prematurely close the surrounding <script> tag", () => {
    const result = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c/script>");
  });
});

describe("productJsonLd", () => {
  const base = {
    name: "Kanchipuram Pure Silk Saree",
    description: "A handwoven silk saree.",
    sku: "SKU-001",
    brand: "MMGM Enterprises",
    images: [{ url: "https://example.com/a.jpg" }],
    sellingPrice: 4999,
    isAvailable: true,
    avgRating: 4.5,
    reviewCount: 3,
    url: "https://example.com/sarees/kanchipuram-pure-silk-saree",
  };

  it("marks in-stock availability correctly", () => {
    const result = productJsonLd(base);
    expect(result.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks out-of-stock availability when isAvailable is false", () => {
    const result = productJsonLd({ ...base, isAvailable: false });
    expect(result.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("includes aggregateRating only when there are reviews", () => {
    expect(productJsonLd(base)).toHaveProperty("aggregateRating");
    expect(productJsonLd({ ...base, reviewCount: 0 })).not.toHaveProperty("aggregateRating");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions starting at 1", () => {
    const result = breadcrumbJsonLd([
      { name: "Home", url: "https://example.com" },
      { name: "Sarees", url: "https://example.com/sarees" },
    ]);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });
});
