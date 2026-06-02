# Next.js Migration Notes

This repository now contains the first Next.js migration pass for Parrilla Meat Shop.

## What moved

- Static storefront pages were converted into `app/` routes.
- Shared header/footer moved into React components.
- Product catalog data was copied into `src/data/products.js` and exported.
- Storefront styling moved into `app/globals.css`.
- Images were copied into `public/images`.
- Cart behavior is still local browser state for this first pass.

## What should come next

1. Install dependencies and run the Next dev server.
2. Add `.env.local` with Supabase project URL and publishable key.
3. Create Supabase schema for products, orders, order items, customers, and admin profiles.
4. Replace local product data with Supabase reads.
5. Replace local checkout behavior with a secure Next.js API route.
6. Add Supabase Auth for admin pages.
7. Add PayMongo and Resend after domain/payment setup.

## Environment variables

Use `.env.example` as the template. Never commit `.env.local`.

## Local note

This Codex/macOS environment rejected Next's native SWC binary signature, so local verification used
the installed WASM compiler fallback:

```sh
NEXT_TEST_WASM_DIR=/Users/saadult/parrilla-meatshop/node_modules/.pnpm/@next+swc-wasm-nodejs@15.5.18/node_modules/@next/swc-wasm-nodejs next build
```

If your normal terminal has `npm` or `pnpm`, try the standard scripts first:

```sh
pnpm dev
pnpm build
```

## Supabase setup flow

1. Open Supabase Dashboard.
2. Go to your project.
3. Open SQL Editor.
4. Run `supabase/migrations/001_initial_schema.sql`.
5. Generate the product seed file:

```sh
node scripts/generate-product-seed.mjs
```

6. Run the generated `supabase/seed-products.sql` in SQL Editor.
7. Confirm the `products` table has 82 rows.
8. After that, update the Next app to read products from Supabase instead of `src/data/products.js`.

Do not paste your secret/service key into chat. The publishable key is enough for public product reads
once Row Level Security policies are in place.
