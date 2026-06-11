import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Parrilla Meat Shop | Quality Frozen Meat & Food Supply",
  description:
    "Retail, wholesale, and reseller meat supply from Parrilla Meat Shop in Alfonso, Cavite.",
  icons: {
    icon: [
      {
        url: "/favicon-16x16.png?v=20260611",
        type: "image/png",
        sizes: "16x16"
      },
      {
        url: "/favicon-32x32.png?v=20260611",
        type: "image/png",
        sizes: "32x32"
      },
      {
        url: "/parrilla-favicon.ico?v=20260611",
        type: "image/x-icon",
        sizes: "256x256"
      },
      {
        url: "/icon.png?v=20260611",
        type: "image/png",
        sizes: "512x512"
      }
    ],
    shortcut: "/parrilla-favicon.ico?v=20260611",
    apple: [
      {
        url: "/apple-touch-icon.png?v=20260611",
        type: "image/png",
        sizes: "180x180"
      }
    ]
  }
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
