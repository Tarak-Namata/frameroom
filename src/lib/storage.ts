// Photo storage driver: local disk by default, any S3-compatible bucket when STORAGE_DRIVER=s3.
import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR } from "./config";
import { FriendlyError } from "./errors";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Readable>;
  remove(key: string): Promise<void>;
}

function localStorage(): Storage {
  const root = UPLOAD_DIR;
  const full = (key: string) => {
    const p = path.resolve(root, key);
    if (!p.startsWith(root + path.sep)) throw new Error("Invalid key");
    return p;
  };
  return {
    async put(key, body) {
      await fs.mkdir(path.dirname(full(key)), { recursive: true });
      await fs.writeFile(full(key), body);
    },
    async get(key) {
      await fs.access(full(key));
      return createReadStream(full(key));
    },
    async remove(key) {
      await fs.rm(full(key), { force: true });
    },
  };
}

function s3Storage(): Storage {
  const missing = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !process.env[k]);
  if (missing.length) throw new FriendlyError(`S3 storage is turned on (STORAGE_DRIVER=s3) but ${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} missing. Add them, or remove STORAGE_DRIVER to use local disk.`);
  const bucket = process.env.S3_BUCKET as string;
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  });
  return {
    async put(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    },
    async get(key) {
      const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return r.Body as Readable;
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

const g = globalThis as unknown as { storage?: Storage };
const driver = () => (g.storage ??= process.env.STORAGE_DRIVER === "s3" ? s3Storage() : localStorage());
export const storage: Storage = {
  put: (k, b, t) => driver().put(k, b, t),
  get: (k) => driver().get(k),
  remove: (k) => driver().remove(k),
};

export function streamResponse(stream: Readable, headers: Record<string, string>) {
  return new Response(Readable.toWeb(stream) as ReadableStream, { headers });
}
