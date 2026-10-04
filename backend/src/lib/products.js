// Shared SELECT: product + category + variants as JSON, with camelCase keys for the frontend.
export const PRODUCT_SELECT = `
  SELECT p.id, p.slug, p.name, p.brand, p.description, p.condition, p.warranty, p.specs, p.images,
    p.is_active AS "isActive", p.is_featured AS "isFeatured", p.created_at AS "createdAt",
    p.seo_title AS "seoTitle", p.seo_description AS "seoDescription",
    c.id AS "categoryId", c.name AS "categoryName", c.slug AS "categorySlug", c.icon AS "categoryIcon",
    COALESCE((SELECT json_agg(json_build_object(
        'id', v.id, 'label', v.label, 'sku', v.sku, 'price', v.price,
        'compareAtPrice', v.compare_at_price, 'stock', v.stock
      ) ORDER BY v.sort_order, v.id) FROM variants v WHERE v.product_id = p.id), '[]'::json) AS variants
  FROM products p JOIN categories c ON c.id = p.category_id`;
