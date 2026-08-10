-- ============================================================================
-- MMGM Enterprises — demo/reference data seed
--
-- Realistic lookup values (spec §3/§18) and demo saree products (spec §55).
-- No product images are seeded — there is no real photography yet, so
-- product cards/category tiles render a brand-colored placeholder tile
-- instead (see src/components/store/media-placeholder.tsx). Swap in real
-- photography via product_images once available (Phase 12 admin upload,
-- or direct insert).
--
-- Idempotent: safe to re-run — every insert is keyed on a unique column
-- with `on conflict do nothing`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------

insert into categories (name, slug, sort_order) values
  ('Silk Sarees', 'silk-sarees', 1),
  ('Cotton Sarees', 'cotton-sarees', 2),
  ('Designer Sarees', 'designer-sarees', 3),
  ('Wedding Sarees', 'wedding-sarees', 4),
  ('Party Wear', 'party-wear', 5),
  ('Handloom', 'handloom', 6),
  ('Festive', 'festive', 7),
  ('Daily Wear', 'daily-wear', 8)
on conflict (slug) do nothing;

insert into materials (name) values
  ('Pure Silk'), ('Blended Silk'), ('Pure Cotton'), ('Cotton Blend'),
  ('Linen'), ('Art Silk')
on conflict (name) do nothing;

insert into fabrics (name) values
  ('Cotton'), ('Silk'), ('Linen'), ('Georgette'), ('Chiffon'),
  ('Organza'), ('Chanderi'), ('Tussar'), ('Handloom')
on conflict (name) do nothing;

insert into patterns (name) values
  ('Floral'), ('Printed'), ('Checks'), ('Stripes'), ('Geometric'),
  ('Traditional'), ('Zari'), ('Embroidery'), ('Plain'), ('Kalamkari'),
  ('Temple Border'), ('Banarasi'), ('Abstract')
on conflict (name) do nothing;

insert into colors (name, hex_code) values
  ('Red', '#C1272D'), ('Blue', '#1F4E8C'), ('Green', '#1B6B3A'),
  ('Yellow', '#D9A824'), ('Pink', '#D46A8C'), ('Black', '#171717'),
  ('White', '#F7F7F5'), ('Orange', '#C1621E'), ('Purple', '#5B2A5E'),
  ('Maroon', '#7A1830'), ('Gold', '#C9A66B'), ('Silver', '#B8B8B8'),
  ('Beige', '#E3D5C0'), ('Brown', '#6B4226'), ('Grey', '#8A8A8A'),
  ('Multicolor', '#B76E79')
on conflict (name) do nothing;

insert into occasions (name) values
  ('Wedding'), ('Party'), ('Festival'), ('Office'), ('Daily Wear'), ('Casual')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Demo products (spec §55) — prices in INR, no images seeded (see header)
-- ---------------------------------------------------------------------------

insert into products (
  sku, name, slug, category_id, fabric_id, material_id,
  description, short_description, original_price, selling_price, discount_amount,
  saree_length_meters, blouse_piece_included, blouse_length_meters,
  primary_color_id, secondary_color_id, pattern_id, border_type, pallu_type,
  work_type, weave_type, wash_care, weight_grams, status
)
select
  v.sku, v.name, v.slug,
  (select id from categories where slug = v.category_slug),
  (select id from fabrics where name = v.fabric_name),
  (select id from materials where name = v.material_name),
  v.description, v.short_description, v.original_price, v.selling_price,
  v.original_price - v.selling_price,
  v.saree_length_meters, true, 0.8,
  (select id from colors where name = v.primary_color),
  (select id from colors where name = v.secondary_color),
  (select id from patterns where name = v.pattern_name),
  v.border_type, v.pallu_type, v.work_type, v.weave_type,
  'Dry clean recommended', v.weight_grams, 'ACTIVE'
from (
  values
    ('MMGM-KAN-001', 'Kanchipuram Pure Silk Saree', 'kanchipuram-pure-silk-saree-maroon-gold',
     'silk-sarees', 'Silk', 'Pure Silk',
     'A timeless Kanchipuram silk saree woven with a rich temple border and zari detailing, crafted for weddings and grand occasions.',
     'Timeless Kanchipuram silk with a rich zari temple border.',
     12999::numeric, 10399::numeric, 6.3::numeric, 'Maroon', 'Gold', 'Temple Border',
     'Temple Border', 'Contrast Zari Pallu', 'Zari Work', 'Handloom', 750::numeric),

    ('MMGM-COT-002', 'Premium Cotton Saree', 'premium-cotton-saree-blue',
     'cotton-sarees', 'Cotton', 'Pure Cotton',
     'A breathable premium cotton saree in soft blue with a clean printed motif, perfect for daily wear and the office.',
     'Breathable premium cotton, perfect for daily wear.',
     2499::numeric, 1999::numeric, 5.5::numeric, 'Blue', null, 'Printed',
     'Simple Border', 'Printed Pallu', null, 'Mill Woven', 420::numeric),

    ('MMGM-BAN-003', 'Banarasi Silk Saree', 'banarasi-silk-saree-red-gold',
     'silk-sarees', 'Silk', 'Pure Silk',
     'An opulent Banarasi silk saree in red and gold, featuring intricate brocade work synonymous with Varanasi''s weaving heritage.',
     'Opulent Banarasi silk with intricate brocade work.',
     15999::numeric, 12799::numeric, 6.3::numeric, 'Red', 'Gold', 'Banarasi',
     'Brocade Border', 'Zari Pallu', 'Brocade', 'Handloom', 800::numeric),

    ('MMGM-GEO-004', 'Floral Georgette Saree', 'floral-georgette-saree-pink',
     'party-wear', 'Georgette', 'Art Silk',
     'A flowing georgette saree with an all-over floral print, light enough for evening parties and festive get-togethers.',
     'Flowing floral georgette, light and party-ready.',
     3499::numeric, 2799::numeric, 5.5::numeric, 'Pink', null, 'Floral',
     'Lace Border', 'Printed Pallu', null, 'Mill Woven', 480::numeric),

    ('MMGM-LIN-005', 'Linen Designer Saree', 'linen-designer-saree-beige',
     'designer-sarees', 'Linen', 'Linen',
     'A minimalist linen designer saree in beige, structured for a polished, contemporary silhouette suited to office and casual wear.',
     'Minimalist linen saree with a polished silhouette.',
     4999::numeric, 3999::numeric, 5.5::numeric, 'Beige', null, 'Plain',
     'Simple Border', 'Plain Pallu', null, 'Handloom', 460::numeric),

    ('MMGM-PRC-006', 'Printed Cotton Saree', 'printed-cotton-saree-yellow',
     'daily-wear', 'Cotton', 'Cotton Blend',
     'A cheerful yellow printed cotton saree designed for effortless daily wear, easy to drape and easy to care for.',
     'Cheerful printed cotton, easy daily-wear drape.',
     1799::numeric, 1439::numeric, 5.5::numeric, 'Yellow', null, 'Printed',
     'Simple Border', 'Printed Pallu', null, 'Mill Woven', 400::numeric),

    ('MMGM-ORG-007', 'Organza Party Wear Saree', 'organza-party-wear-saree-purple',
     'party-wear', 'Organza', 'Art Silk',
     'A statement organza saree in deep purple with delicate embroidery along the border, made for parties and celebrations.',
     'Statement organza with delicate border embroidery.',
     5999::numeric, 4799::numeric, 5.5::numeric, 'Purple', null, 'Embroidery',
     'Embroidered Border', 'Embroidered Pallu', 'Thread Embroidery', 'Mill Woven', 500::numeric),

    ('MMGM-HAN-008', 'Handloom Saree', 'handloom-saree-green',
     'handloom', 'Handloom', 'Pure Cotton',
     'A traditionally handwoven saree in deep green, showcasing the craftsmanship of India''s handloom weaving communities.',
     'Traditionally handwoven, showcasing artisan craftsmanship.',
     6499::numeric, 5199::numeric, 5.5::numeric, 'Green', null, 'Traditional',
     'Woven Border', 'Woven Pallu', 'Handloom Weave', 'Handloom', 550::numeric),

    ('MMGM-EMB-009', 'Embroidered Designer Saree', 'embroidered-designer-saree-black',
     'designer-sarees', 'Georgette', 'Art Silk',
     'A striking black designer saree with all-over embroidery, tailored for evening parties and wedding functions alike.',
     'Striking all-over embroidery for evening occasions.',
     8999::numeric, 7199::numeric, 5.5::numeric, 'Black', null, 'Embroidery',
     'Embroidered Border', 'Embroidered Pallu', 'Sequin Embroidery', 'Mill Woven', 520::numeric),

    ('MMGM-TRA-010', 'Traditional Silk Saree', 'traditional-silk-saree-orange',
     'festive', 'Silk', 'Blended Silk',
     'A vibrant orange traditional silk saree with classic motifs, well suited to festive occasions and temple visits.',
     'Vibrant traditional silk with classic festive motifs.',
     9999::numeric, 7999::numeric, 6.3::numeric, 'Orange', null, 'Traditional',
     'Temple Border', 'Contrast Pallu', 'Thread Work', 'Handloom', 700::numeric),

    ('MMGM-CHA-011', 'Chanderi Silk Saree', 'chanderi-silk-saree-silver',
     'silk-sarees', 'Chanderi', 'Blended Silk',
     'A lightweight Chanderi silk saree in silver with fine zari buttis scattered across the body, elegant for festive wear.',
     'Lightweight Chanderi silk with scattered zari buttis.',
     7499::numeric, 5999::numeric, 5.5::numeric, 'Silver', null, 'Zari',
     'Zari Border', 'Zari Pallu', 'Zari Butti', 'Handloom', 480::numeric),

    ('MMGM-TUS-012', 'Tussar Silk Saree', 'tussar-silk-saree-brown',
     'handloom', 'Tussar', 'Pure Silk',
     'An earthy Tussar silk saree in warm brown with a natural textured finish, versatile for office and casual outings.',
     'Earthy Tussar silk with a natural textured finish.',
     6999::numeric, 5599::numeric, 5.5::numeric, 'Brown', null, 'Plain',
     'Simple Border', 'Plain Pallu', null, 'Handloom', 460::numeric)
) as v(
  sku, name, slug, category_slug, fabric_name, material_name,
  description, short_description, original_price, selling_price, saree_length_meters,
  primary_color, secondary_color, pattern_name, border_type, pallu_type,
  work_type, weave_type, weight_grams
)
on conflict (sku) do nothing;

-- ---------------------------------------------------------------------------
-- Occasion tagging (product_occasions join)
-- ---------------------------------------------------------------------------

insert into product_occasions (product_id, occasion_id)
select p.id, o.id from products p, occasions o
where (p.sku, o.name) in (
  ('MMGM-KAN-001', 'Wedding'), ('MMGM-KAN-001', 'Festival'),
  ('MMGM-COT-002', 'Daily Wear'), ('MMGM-COT-002', 'Office'),
  ('MMGM-BAN-003', 'Wedding'),
  ('MMGM-GEO-004', 'Party'),
  ('MMGM-LIN-005', 'Office'), ('MMGM-LIN-005', 'Casual'),
  ('MMGM-PRC-006', 'Daily Wear'),
  ('MMGM-ORG-007', 'Party'),
  ('MMGM-HAN-008', 'Festival'), ('MMGM-HAN-008', 'Casual'),
  ('MMGM-EMB-009', 'Party'), ('MMGM-EMB-009', 'Wedding'),
  ('MMGM-TRA-010', 'Festival'),
  ('MMGM-CHA-011', 'Festival'), ('MMGM-CHA-011', 'Wedding'),
  ('MMGM-TUS-012', 'Office'), ('MMGM-TUS-012', 'Casual')
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Starter inventory row per product (required — products has no default
-- stock otherwise, and the app treats "no inventory row" as unavailable)
-- ---------------------------------------------------------------------------

insert into inventory (product_id, quantity, low_stock_threshold, is_available)
select id, 25, 5, true from products
where sku like 'MMGM-%'
on conflict (product_id) do nothing;
