import { Star } from "lucide-react";
import { ExpandableSection } from "@/components/store/product/expandable-section";
import type { ProductDetail, ProductReview } from "@/features/products/detail";

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function ProductInfoSections({
  product,
  reviews,
}: {
  product: ProductDetail;
  reviews: ProductReview[];
}) {
  return (
    <div className="mt-16 max-w-3xl">
      <ExpandableSection title="Description" defaultOpen>
        <p>
          {product.description ??
            product.shortDescription ??
            "No description available."}
        </p>
      </ExpandableSection>

      <ExpandableSection title="Saree Details">
        <DetailRow label="Fabric" value={product.fabricName} />
        <DetailRow label="Material" value={product.materialName} />
        <DetailRow
          label="Saree Length"
          value={
            product.sareeLengthMeters ? `${product.sareeLengthMeters} m` : null
          }
        />
        <DetailRow
          label="Blouse Piece"
          value={product.blousePieceIncluded ? "Included" : "Not included"}
        />
        <DetailRow
          label="Blouse Length"
          value={
            product.blouseLengthMeters
              ? `${product.blouseLengthMeters} m`
              : null
          }
        />
        <DetailRow label="Primary Color" value={product.primaryColorName} />
        <DetailRow label="Secondary Color" value={product.secondaryColorName} />
        <DetailRow label="Pattern" value={product.patternName} />
        <DetailRow label="Design" value={product.design} />
        <DetailRow label="Border" value={product.borderType} />
        <DetailRow label="Pallu" value={product.palluType} />
        <DetailRow
          label="Occasion"
          value={
            product.occasions.length > 0 ? product.occasions.join(", ") : null
          }
        />
        <DetailRow label="Work" value={product.workType} />
        <DetailRow label="Weave" value={product.weaveType} />
        <DetailRow label="Wash Care" value={product.washCare} />
        <DetailRow
          label="Weight"
          value={product.weightGrams ? `${product.weightGrams} g` : null}
        />
        <DetailRow label="Country of Origin" value={product.countryOfOrigin} />
      </ExpandableSection>

      <ExpandableSection title="Shipping">
        <p>
          Dispatched within 2–3 business days. Delivery timelines vary by
          location — check the estimated delivery above.
        </p>
      </ExpandableSection>

      <ExpandableSection title="Returns">
        <p>
          {product.returnEligible
            ? `This item can be returned within ${product.returnPeriodDays} days of delivery, provided it is unused and in its original packaging.`
            : "This item is not eligible for returns."}
        </p>
      </ExpandableSection>

      <ExpandableSection title={`Reviews (${reviews.length})`}>
        {reviews.length === 0 ? (
          <p>
            No reviews yet. Be the first to review this saree after your
            purchase.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-border pb-4 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < review.rating
                            ? "size-3 fill-brand-mustard text-brand-mustard"
                            : "size-3 text-border"
                        }
                      />
                    ))}
                  </div>
                  {review.isVerifiedPurchase ? (
                    <span className="text-meta text-muted-foreground">
                      Verified Buyer
                    </span>
                  ) : null}
                </div>
                {review.title ? (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {review.title}
                  </p>
                ) : null}
                {review.body ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ExpandableSection>
    </div>
  );
}
