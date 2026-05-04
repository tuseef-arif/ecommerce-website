/**
 * Server-side profile image checks: max size + magic-byte format (do not trust MIME/extension alone).
 */

export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB

export type ProfileImageKind = "jpeg" | "png" | "webp";

export type ValidateProfileImageBufferResult =
  | { ok: true; kind: ProfileImageKind }
  | { ok: false; reason: "too_small" | "unknown_format" };

export const validateProfileImageBuffer = (
  buffer: Buffer,
): ValidateProfileImageBufferResult => {
  if (buffer.length < 12) {
    return { ok: false, reason: "too_small" };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ok: true, kind: "jpeg" };
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ok: true, kind: "png" };
  }

  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return { ok: true, kind: "webp" };
  }

  return { ok: false, reason: "unknown_format" };
};

export const extensionForProfileImageKind = (
  kind: ProfileImageKind,
): string => {
  if (kind === "jpeg") return "jpg";
  if (kind === "png") return "png";
  return "webp";
};
