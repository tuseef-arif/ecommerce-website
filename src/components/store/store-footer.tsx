import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  IconClock,
  IconInstagram,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTikTok,
  IconWhatsApp,
  IconYouTube,
} from "@/components/icons";
import { CustomLink } from "@/components/ui/custom-link";
import {
  SITE_COPYRIGHT_LINE,
  SITE_FOOTER,
  SITE_MAP_IFRAME_TITLE,
  SITE_PATH_LOGO,
  SITE_PATH_PAYMENT_METHODS_SVG,
  SITE_ROUTES,
  SITE_SOCIAL_LABELS,
  STORE_ADDRESS,
  STORE_BUSINESS_NAME,
  STORE_EMAIL,
  STORE_GOOGLE_MAPS_PLACE_URL,
  STORE_HOURS,
  STORE_MAP_EMBED_SRC,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
  STORE_SOCIAL_INSTAGRAM,
  STORE_SOCIAL_TIKTOK,
  STORE_SOCIAL_WHATSAPP,
  STORE_SOCIAL_YOUTUBE,
  STORE_TAGLINE,
  STORE_SHELL,
} from "@/lib/config/site-config";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

type ContactRowProps = {
  icon: ReactNode;
  children: ReactNode;
};

const ContactRow = ({ icon, children }: ContactRowProps) => (
  <li className="flex gap-3 text-sm leading-snug">
    <span className="mt-0.5 shrink-0 opacity-95" aria-hidden>
      {icon}
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

export const StoreFooter = () => {
  const brandSocialLinks: {
    href: string;
    label: string;
    Icon: SvgIcon;
  }[] = [
    {
      href: STORE_SOCIAL_WHATSAPP,
      label: SITE_SOCIAL_LABELS.whatsapp,
      Icon: IconWhatsApp,
    },
    {
      href: STORE_SOCIAL_YOUTUBE,
      label: SITE_SOCIAL_LABELS.youtube,
      Icon: IconYouTube,
    },
    {
      href: STORE_SOCIAL_INSTAGRAM,
      label: SITE_SOCIAL_LABELS.instagram,
      Icon: IconInstagram,
    },
    {
      href: STORE_SOCIAL_TIKTOK,
      label: SITE_SOCIAL_LABELS.tiktok,
      Icon: IconTikTok,
    },
  ].filter((s) => s.href.length > 0);

  return (
    <footer className="store-footer mt-auto min-w-0 w-full max-w-full">
      <div className={`py-10 md:py-12 lg:py-14 ${STORE_SHELL}`}>
        <div className="grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
          <div className="min-w-0">
            <Link
              href={SITE_ROUTES.home}
              className="store-footer__focus-ring inline-flex max-w-full flex-nowrap items-center justify-start gap-3 rounded-md"
            >
              <Image
                src={SITE_PATH_LOGO}
                alt=""
                width={800}
                height={120}
                className="h-9 w-auto max-w-[min(52%,11rem)] shrink-0 object-contain object-left sm:h-10 sm:max-w-[min(46%,14rem)] md:h-11 md:max-w-[min(40%,16rem)]"
                unoptimized
              />
              <span
                id="footer-business-name"
                className="store-footer__heading min-w-0 text-left leading-tight"
              >
                {STORE_BUSINESS_NAME}
              </span>
            </Link>
            <p className="store-footer__tagline mt-3">{STORE_TAGLINE}</p>

            {brandSocialLinks.length > 0 ? (
              <ul className="mt-6 flex list-none flex-wrap gap-4 p-0">
                {brandSocialLinks.map(({ href, label, Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="store-footer__icon-btn store-footer__focus-ring rounded-md"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                    >
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-8 flex list-none flex-col gap-4 p-0">
              <ContactRow icon={<IconClock />}>
                <span>{STORE_HOURS}</span>
              </ContactRow>
              <ContactRow icon={<IconMapPin />}>
                <span>{STORE_ADDRESS}</span>
              </ContactRow>
              {STORE_PHONE_DISPLAY ? (
                <ContactRow icon={<IconPhone />}>
                  {STORE_PHONE_TEL ? (
                    <CustomLink href={STORE_PHONE_TEL} variant="on-brand">
                      {STORE_PHONE_DISPLAY}
                    </CustomLink>
                  ) : (
                    <span>{STORE_PHONE_DISPLAY}</span>
                  )}
                </ContactRow>
              ) : (
                <ContactRow icon={<IconPhone />}>
                  <CustomLink
                    href={SITE_ROUTES.contact}
                    variant="on-brand"
                    className="store-footer__focus-ring rounded-md"
                  >
                    {SITE_FOOTER.phoneFallbackLink}
                  </CustomLink>
                </ContactRow>
              )}
              {STORE_EMAIL ? (
                <ContactRow icon={<IconMail />}>
                  <CustomLink href={`mailto:${STORE_EMAIL}`} variant="on-brand">
                    {STORE_EMAIL}
                  </CustomLink>
                </ContactRow>
              ) : (
                <ContactRow icon={<IconMail />}>
                  <CustomLink
                    href={SITE_ROUTES.contact}
                    variant="on-brand"
                    className="store-footer__focus-ring rounded-md"
                  >
                    {SITE_FOOTER.emailFallbackLink}
                  </CustomLink>
                </ContactRow>
              )}
            </ul>

            <section className="mt-8" aria-labelledby="footer-payments-heading">
              <h3
                id="footer-payments-heading"
                className="store-footer__heading text-base sm:text-lg"
              >
                {SITE_FOOTER.paymentsHeading}
              </h3>
              <div className="mt-3 w-full min-w-0 max-w-full overflow-x-clip">
                <Image
                  src={SITE_PATH_PAYMENT_METHODS_SVG}
                  alt={SITE_FOOTER.paymentMethodsImageAlt}
                  width={257}
                  height={23}
                  className="h-auto w-full max-w-full min-w-0 object-contain object-left"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              </div>
            </section>
          </div>

          <section className="min-w-0" aria-labelledby="footer-visit-heading">
            <h2 id="footer-visit-heading" className="store-footer__heading">
              {SITE_FOOTER.visitHeading}
            </h2>
            <p className="store-footer__tagline flex min-w-0 max-w-full flex-col gap-1 pb-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1 sm:pb-4">
              <span className="min-w-0">{SITE_FOOTER.mapHint}</span>
              <CustomLink
                href={STORE_GOOGLE_MAPS_PLACE_URL}
                variant="on-brand"
                className="store-footer__focus-ring w-fit max-w-full rounded-md text-sm font-medium break-words"
              >
                {SITE_FOOTER.openInGoogleMaps}
              </CustomLink>
            </p>
            <div className="store-footer__map-shell">
              <iframe
                title={SITE_MAP_IFRAME_TITLE}
                src={STORE_MAP_EMBED_SRC}
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-full w-full max-w-full"
              />
            </div>
          </section>
        </div>
      </div>

      <div className={`store-footer__bar ${STORE_SHELL}`}>
        <p className="store-footer__copyright">{SITE_COPYRIGHT_LINE}</p>
      </div>
    </footer>
  );
};
