-- ============================================================================
-- MMGM Enterprises — demo/reference data seed
--
-- Realistic lookup values (spec §3/§18) and demo saree products (spec §55).
-- Product/category photography is seeded from Pexels (free-license stock
-- photos) rather than real MMGM Enterprises product shoots, which don't
-- exist yet — src/components/store/media-placeholder.tsx remains the
-- fallback for any product/category that ends up with no image. Swap
-- these for real photography via the admin product-media manager (Phase
-- 11) whenever it exists.
--
-- Every seeded photo is pure product photography — folded/draped fabric
-- or garment close-ups only, no people, hands, faces, or mannequins in
-- frame (verified per-image, not just by search-term). Deliberately not
-- lifestyle/model photography, even though that's far more plentiful on
-- free stock sites for this subject.
--
-- Idempotent: safe to re-run — every insert is keyed on a unique column
-- with `on conflict do nothing` (or `do update` where a re-run should
-- refresh a previously-null value, like categories.image_url).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------

-- image_url uses `do update` (not `do nothing`) so re-running this file
-- after Phase 4/etc. already created these rows still backfills the
-- photo added later, rather than leaving existing rows null forever.
insert into categories (name, slug, sort_order, image_url) values
  ('Silk Sarees', 'silk-sarees', 1, 'https://images.pexels.com/photos/10317106/pexels-photo-10317106.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Cotton Sarees', 'cotton-sarees', 2, 'https://images.pexels.com/photos/5648264/pexels-photo-5648264.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Designer Sarees', 'designer-sarees', 3, 'https://images.pexels.com/photos/2933636/pexels-photo-2933636.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Wedding Sarees', 'wedding-sarees', 4, 'https://images.pexels.com/photos/5439051/pexels-photo-5439051.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Party Wear', 'party-wear', 5, 'https://images.pexels.com/photos/7956639/pexels-photo-7956639.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Handloom', 'handloom', 6, 'https://images.pexels.com/photos/10443442/pexels-photo-10443442.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Festive', 'festive', 7, 'https://images.pexels.com/photos/36299798/pexels-photo-36299798.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Daily Wear', 'daily-wear', 8, 'https://images.pexels.com/photos/8465934/pexels-photo-8465934.jpeg?auto=compress&cs=tinysrgb&w=800')
on conflict (slug) do update set image_url = excluded.image_url;

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
-- Product photography (Pexels, free license) — one or two images per
-- product. `product_images` has no natural unique key to `on conflict`
-- against, so idempotency is a `not exists` guard instead: only inserts
-- for a product that currently has zero image rows, rather than
-- duplicating on every re-run.
-- ---------------------------------------------------------------------------

insert into product_images (product_id, url, is_primary, sort_order)
select p.id, v.url, v.is_primary, v.sort_order
from products p
join (
  values
    ('MMGM-KAN-001', 'https://images.pexels.com/photos/5439054/pexels-photo-5439054.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-KAN-001', 'https://images.pexels.com/photos/36299800/pexels-photo-36299800.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-COT-002', 'https://images.pexels.com/photos/6275998/pexels-photo-6275998.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-COT-002', 'https://images.pexels.com/photos/7717495/pexels-photo-7717495.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-BAN-003', 'https://images.pexels.com/photos/13049903/pexels-photo-13049903.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-BAN-003', 'https://images.pexels.com/photos/7232843/pexels-photo-7232843.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-GEO-004', 'https://images.pexels.com/photos/7956629/pexels-photo-7956629.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-GEO-004', 'https://images.pexels.com/photos/4814062/pexels-photo-4814062.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-LIN-005', 'https://images.pexels.com/photos/4938326/pexels-photo-4938326.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-LIN-005', 'https://images.pexels.com/photos/8465944/pexels-photo-8465944.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-PRC-006', 'https://images.pexels.com/photos/413676/pexels-photo-413676.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-PRC-006', 'https://images.pexels.com/photos/8753729/pexels-photo-8753729.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-ORG-007', 'https://images.pexels.com/photos/8793879/pexels-photo-8793879.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-ORG-007', 'https://images.pexels.com/photos/6571744/pexels-photo-6571744.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-HAN-008', 'https://images.pexels.com/photos/7794262/pexels-photo-7794262.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-EMB-009', 'https://images.pexels.com/photos/1487809/pexels-photo-1487809.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-EMB-009', 'https://images.pexels.com/photos/8007347/pexels-photo-8007347.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-TRA-010', 'https://images.pexels.com/photos/4862874/pexels-photo-4862874.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-TRA-010', 'https://images.pexels.com/photos/8754101/pexels-photo-8754101.jpeg?auto=compress&cs=tinysrgb&w=1200', false, 1),
    ('MMGM-CHA-011', 'https://images.pexels.com/photos/6920410/pexels-photo-6920410.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0),
    ('MMGM-TUS-012', 'https://images.pexels.com/photos/6331032/pexels-photo-6331032.jpeg?auto=compress&cs=tinysrgb&w=1200', true, 0)
) as v(sku, url, is_primary, sort_order) on v.sku = p.sku
where not exists (
  select 1 from product_images pi where pi.product_id = p.id
);

-- ---------------------------------------------------------------------------
-- Starter inventory row per product (required — products has no default
-- stock otherwise, and the app treats "no inventory row" as unavailable)
-- ---------------------------------------------------------------------------

insert into inventory (product_id, quantity, low_stock_threshold, is_available)
select id, 25, 5, true from products
where sku like 'MMGM-%'
on conflict (product_id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo coupon (Phase 7 checkout) — storewide, no product/category scoping
-- ---------------------------------------------------------------------------

insert into coupons (code, type, value, min_order_amount, max_discount_amount, per_user_limit, is_active) values
  ('WELCOME10', 'PERCENTAGE', 10, 999, 500, 1, true)
on conflict (code) do nothing;
