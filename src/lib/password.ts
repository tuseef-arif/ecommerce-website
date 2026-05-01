import { scryptSync, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";

export const hashPassword = async (plainText: string): Promise<string> => {
  return hash(plainText, 12);
};

const verifyLegacyScryptHash = (
  plainText: string,
  storedPassword: string,
): boolean => {
  const [salt, hashHex] = storedPassword.split(":");

  if (!salt || !hashHex) {
    return false;
  }

  const candidateHash = scryptSync(plainText, salt, 64);
  const storedHash = Buffer.from(hashHex, "hex");

  if (candidateHash.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, storedHash);
};

export const verifyPassword = async (
  plainText: string,
  storedPassword: string,
): Promise<boolean> => {
  if (storedPassword.includes(":")) {
    return verifyLegacyScryptHash(plainText, storedPassword);
  }

  return compare(plainText, storedPassword);
};
