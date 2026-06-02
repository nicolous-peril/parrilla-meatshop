import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { displayName, getProduct, fallbackProducts } from "@/lib/products";
import { getStoreProducts } from "@/lib/productRepository";

export function generateStaticParams() {
  return fallbackProducts.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const products = await getStoreProducts();
  const product = getProduct(products, id);
  return {
    title: product ? `${displayName(product)} | Parrilla Meat Shop` : "Product | Parrilla Meat Shop"
  };
}

export default async function ProductPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const products = await getStoreProducts();
  const product = getProduct(products, id);
  if (!product) notFound();
  const channel = query?.channel || product.channels[0] || "retail";

  return (
    <main>
      <section className="section">
        <ProductDetailClient product={product} channel={channel} />
      </section>
    </main>
  );
}
