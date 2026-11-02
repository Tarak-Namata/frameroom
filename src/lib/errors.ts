import { fail } from "./http";

const FRIENDLY: Record<string, string> = {
  ENOSPC: "Your server is out of disk space. Free up some space or switch to S3 storage, then try again.",
  EACCES: "Frameroom can't write to its data folder. Check that the data volume is writable.",
  EROFS: "Frameroom's data folder is read-only. Check that the data volume is writable.",
  InvalidAccessKeyId: "Your S3 storage rejected the access key. Check S3_ACCESS_KEY_ID.",
  SignatureDoesNotMatch: "Your S3 storage rejected the secret key. Check S3_SECRET_ACCESS_KEY.",
  NoSuchBucket: "The S3 bucket doesn't exist. Check S3_BUCKET.",
  AccessDenied: "Your S3 storage denied access. Check the key's permissions for this bucket.",
};

export class FriendlyError extends Error {}

export function friendlyMessage(e: unknown, fallback = "Something went wrong on our side. Please try again in a moment.") {
  if (e instanceof FriendlyError) return e.message;
  const err = e as { code?: string; name?: string; Code?: string };
  return FRIENDLY[err?.code || ""] || FRIENDLY[err?.name || ""] || FRIENDLY[err?.Code || ""] || fallback;
}

// Wraps a route handler so unexpected errors become a friendly JSON message.
export function safe<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("[frameroom]", e);
      return fail(friendlyMessage(e), 500);
    }
  };
}
