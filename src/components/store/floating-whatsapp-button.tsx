import { IconWhatsApp } from "@/components/icons";
import {
  SITE_SOCIAL_LABELS,
  STORE_SOCIAL_WHATSAPP,
} from "@/lib/config/site-config";

export const FloatingWhatsAppButton = () => {
  if (!STORE_SOCIAL_WHATSAPP.trim()) {
    return null;
  }

  return (
    <a
      href={STORE_SOCIAL_WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${SITE_SOCIAL_LABELS.whatsapp} us`}
      className="group fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 text-white md:bottom-6 md:right-6"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <span className="max-w-0 overflow-hidden whitespace-nowrap rounded-full bg-[#25D366] px-0 py-2 text-base font-semibold opacity-0 shadow-md transition-all duration-300 ease-out group-hover:max-w-40 group-hover:px-5 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:px-5 group-focus-visible:opacity-100">
        WhatsApp us
      </span>
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4cd964] shadow-lg transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105 group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#25D366]">
        <IconWhatsApp className="h-9 w-9" />
      </span>
    </a>
  );
};
