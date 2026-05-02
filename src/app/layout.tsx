import type { Metadata } from "next";
import "./globals.css";
import { geistMono, satoshi } from "./fonts";
import {
  SITE_AREA_SERVED_CITY,
  SITE_AREA_SERVED_COUNTRY,
  SITE_META_DESCRIPTION,
  SITE_OG_LOCALE,
  SITE_PATH_FAVICON,
  SITE_ROUTES,
  SITE_URL,
  STORE_ADDRESS_COUNTRY,
  STORE_ADDRESS_LOCALITY,
  STORE_ADDRESS_STREET,
  STORE_BUSINESS_NAME,
  STORE_EMAIL,
  STORE_PHONE_TEL,
} from "@/lib/config/site-config";

const defaultTitle = `${STORE_BUSINESS_NAME} | Store`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: { icon: SITE_PATH_FAVICON },
  title: { default: defaultTitle, template: `%s | ${STORE_BUSINESS_NAME}` },
  description: SITE_META_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: SITE_OG_LOCALE,
    url: SITE_ROUTES.home,
    siteName: STORE_BUSINESS_NAME,
    title: defaultTitle,
    description: SITE_META_DESCRIPTION,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "MobilePhoneStore"],
  "@id": `${SITE_URL}/#organization`,
  name: STORE_BUSINESS_NAME,
  url: SITE_URL,
  description: SITE_META_DESCRIPTION,
  email: STORE_EMAIL,
  telephone: STORE_PHONE_TEL.replace(/^tel:/i, ""),
  address: {
    "@type": "PostalAddress",
    streetAddress: STORE_ADDRESS_STREET,
    addressLocality: STORE_ADDRESS_LOCALITY,
    addressCountry: STORE_ADDRESS_COUNTRY,
  },
  areaServed: {
    "@type": "City",
    name: SITE_AREA_SERVED_CITY,
    containedInPlace: { "@type": "Country", name: SITE_AREA_SERVED_COUNTRY },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
