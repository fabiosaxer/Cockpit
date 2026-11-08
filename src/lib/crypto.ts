import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** Schluessel aus TOKEN_ENCRYPTION_KEY (beliebig lange Zeichenkette) abgeleitet. */
function key(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 20) throw new Error("TOKEN_ENCRYPTION_KEY fehlt oder ist zu kurz");
  return createHash("sha256").update(secret).digest();
}

/** AES-256-GCM. Format: iv.tag.ciphertext (base64url) */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(value: string): string {
  const [iv, tag, data] = value.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
