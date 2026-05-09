/**
 * Store-facing timestamps are shown in Pakistan Standard Time (UTC+5, no DST).
 * Database values remain UTC; convert only at display / calendar boundaries.
 */
export const STORE_DISPLAY_TIME_ZONE = "Asia/Karachi" as const;

/** Fixed offset for Pakistan Standard Time (matches {@link STORE_DISPLAY_TIME_ZONE}). */
export const STORE_DISPLAY_UTC_OFFSET = "+05:00" as const;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** `YYYY-MM-DD` for an instant in a specific IANA time zone. */
export const calendarDayKeyInTimeZone = (
  instant: Date,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

const calendarPartsInTimeZone = (
  instant: Date,
  timeZone: string,
): { y: number; m: number; d: number } => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = fmt.formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value);
  return { y: pick("year"), m: pick("month"), d: pick("day") };
};

/** Previous Gregorian calendar day (used with wall-calendar y/m/d). */
const decrementCalendarDay = (
  y: number,
  m: number,
  d: number,
): [number, number, number] => {
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
};

const calendarKey = (y: number, m: number, d: number): string =>
  `${y}-${pad2(m)}-${pad2(d)}`;

/**
 * Oldest → newest: the last `count` **calendar** days ending on “today” in
 * `timeZone`, encoded as `YYYY-MM-DD` (that zone’s civil date).
 */
export const getLastNCalendarDayKeysInTimeZone = (
  count: number,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string[] => {
  const { y, m, d } = calendarPartsInTimeZone(new Date(), timeZone);
  const keys: string[] = [];
  let cy = y;
  let cm = m;
  let cd = d;
  for (let i = 0; i < count; i++) {
    keys.unshift(calendarKey(cy, cm, cd));
    [cy, cm, cd] = decrementCalendarDay(cy, cm, cd);
  }
  return keys;
};

/** Range bounds for Prisma `createdAt` filters covering those calendar days in the zone. */
/** Start of a civil `YYYY-MM-DD` in the store zone (PKT). */
export const storeCivilDayStartInstant = (isoDay: string): Date =>
  new Date(`${isoDay}T00:00:00${STORE_DISPLAY_UTC_OFFSET}`);

/** End of a civil `YYYY-MM-DD` in the store zone (PKT). */
export const storeCivilDayEndInstant = (isoDay: string): Date =>
  new Date(`${isoDay}T23:59:59.999${STORE_DISPLAY_UTC_OFFSET}`);

/**
 * Noon on a store civil `YYYY-MM-DD` (stable anchor for parsing HTML date inputs
 * and formatting day keys without midnight edge cases).
 */
export const storeCalendarDayAnchorInstant = (isoDay: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return new Date(Number.NaN);
  return new Date(`${isoDay}T12:00:00${STORE_DISPLAY_UTC_OFFSET}`);
};

export const getInstantRangeForCalendarDayKeys = (
  keys: readonly string[],
): { start: Date; end: Date } => {
  if (keys.length === 0) {
    const now = new Date();
    return { start: now, end: now };
  }
  const first = keys[0];
  const last = keys[keys.length - 1];
  return {
    start: storeCivilDayStartInstant(first),
    end: storeCivilDayEndInstant(last),
  };
};

export const formatInstantForStoreDate = (
  iso: string | Date,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return typeof iso === "string" ? iso : "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(d);
};

/** `Date | null` → list/table copy (null → null). */
export const formatInstantForStoreDateOrNull = (
  instant: Date | null,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string | null => {
  if (!instant) return null;
  return formatInstantForStoreDate(instant, timeZone);
};

export const formatInstantForStoreDateTime = (
  iso: string | Date | null | undefined,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string => {
  if (iso === null || iso === undefined) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(d);
};

/**
 * Short label for a civil `YYYY-MM-DD` string interpreted in the store zone
 * (used when the key already represents a zoned calendar day).
 */
export const formatStoreCalendarDayKeyShort = (
  isoDay: string,
  timeZone: string = STORE_DISPLAY_TIME_ZONE,
): string => {
  const anchor = storeCalendarDayAnchorInstant(isoDay);
  if (Number.isNaN(anchor.getTime())) return isoDay;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(anchor);
};
