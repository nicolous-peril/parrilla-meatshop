import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Parrilla Meat Shop | Fresh Meat Delivery",
  description:
    "Retail, wholesale, and reseller meat supply from Parrilla Meat Shop in Alfonso, Cavite."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="shop-body">
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
