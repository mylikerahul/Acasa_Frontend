

import "./globals.css";
import Script from "next/script";
import Providers from "./Providers.jsx";

export const metadata = {
  title: "Flavor Starter",
  description: "Premium Real Estate Properties in Dubai & UAE",
  keywords: "real estate, dubai, uae, properties, luxury homes, apartments",
  authors: [{ name: "Flavor Starter" }],
  openGraph: {
    title: "Flavor Starter",
    description: "Premium Real Estate Properties in Dubai & UAE",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>

        {/* Disable right-click context menu */}
        <Script id="disable-context-menu" strategy="afterInteractive">
          {`
            window.addEventListener("contextmenu", (e) => e.preventDefault());
          `}
        </Script>
      </head>

      <body className="antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}