import type { Metadata } from "next";
import Link from "next/link";
import { IconClock, IconMail, IconMapPin, IconPhone } from "@/components/icons";
import { CustomLink } from "@/components/ui/custom-link";
import {
  SITE_ROUTES,
  SITE_FOOTER,
  STORE_ADDRESS,
  STORE_BUSINESS_NAME,
  STORE_EMAIL,
  STORE_GOOGLE_MAPS_PLACE_URL,
  STORE_HOURS,
  SITE_META_DESCRIPTION,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
  STORE_SHELL,
} from "@/lib/config/site-config";

export const metadata: Metadata = {
  title: `Contact | ${STORE_BUSINESS_NAME}`,
  description: SITE_META_DESCRIPTION,
};

export default function ContactPage() {
  return (
    <main
      className={`flex flex-1 flex-col gap-8 py-10 md:py-14 ${STORE_SHELL}`}
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900 md:text-3xl">
          Contact
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Visit us in store or reach us by phone or email.
        </p>
      </header>

      <ul className="max-w-xl space-y-4 text-sm text-neutral-800">
        <li className="flex gap-3">
          <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Hours
            </p>
            <p>{STORE_HOURS}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Address
            </p>
            <p>{STORE_ADDRESS}</p>
            <CustomLink
              href={STORE_GOOGLE_MAPS_PLACE_URL}
              className="mt-1 inline-flex font-semibold text-[var(--store-brand-primary)]"
            >
              {SITE_FOOTER.openInGoogleMaps}
            </CustomLink>
          </div>
        </li>
        <li className="flex gap-3">
          <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Phone
            </p>
            {STORE_PHONE_TEL ? (
              <CustomLink href={STORE_PHONE_TEL}>
                {STORE_PHONE_DISPLAY}
              </CustomLink>
            ) : (
              <span>{STORE_PHONE_DISPLAY}</span>
            )}
          </div>
        </li>
        <li className="flex gap-3">
          <IconMail className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Email
            </p>
            {STORE_EMAIL ? (
              <CustomLink
                href={`mailto:${STORE_EMAIL}`}
                className="break-all font-medium"
              >
                {STORE_EMAIL}
              </CustomLink>
            ) : (
              <span>—</span>
            )}
          </div>
        </li>
      </ul>

      <Link
        href={SITE_ROUTES.home}
        className="text-sm font-semibold text-[var(--store-brand-primary)] underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
