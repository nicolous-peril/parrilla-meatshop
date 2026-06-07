import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { displayName } from "@/lib/products";
import { getStoreProduct } from "@/lib/productRepository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getStoreProduct(id);
  return {
    title: product ? `${displayName(product)} | Parrilla Meat Shop` : "Product | Parrilla Meat Shop"
  };
}

export default async function ProductPage({ params, searchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const product = await getStoreProduct(id);
  if (!product) notFound();
  const requestedChannel = query?.channel;
  const channel = product.channels.includes(requestedChannel)
    ? requestedChannel
    : product.channels[0] || "retail";

  return (
    <main>
      <section className="section">
        <ProductDetailClient product={product} channel={channel} />
      </section>
    </main>
  );
}
