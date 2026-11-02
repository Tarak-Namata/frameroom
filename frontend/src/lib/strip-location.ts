// Removes location (GPS) metadata from uploaded photos WITHOUT re-encoding the image,
// so the stored original stays pixel-identical. Other EXIF (camera, lens, date) is kept.
import sharp from "sharp";
import { crc32 } from "node:zlib";

const TYPE_SIZES: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
const hasGpsText = (b: Buffer) => /GPS|exif:GPS/i.test(b.toString("latin1"));

// Empties the GPS IFD inside an EXIF (TIFF) block that starts at offset `t` of `seg`.
function wipeExifGps(seg: Buffer, t: number) {
  const le = seg.toString("latin1", t, t + 2) === "II";
  const r16 = (o: number) => (le ? seg.readUInt16LE(o) : seg.readUInt16BE(o));
  const r32 = (o: number) => (le ? seg.readUInt32LE(o) : seg.readUInt32BE(o));
  const ifd0 = t + r32(t + 4);
  for (let k = 0, n = r16(ifd0); k < n; k++) {
    const e = ifd0 + 2 + k * 12;
    if (r16(e) !== 0x8825) continue;
    const gps = t + r32(e + 8);
    const m = r16(gps);
    for (let j = 0; j < m; j++) {
      const ge = gps + 2 + j * 12;
      const size = r32(ge + 4) * (TYPE_SIZES[r16(ge + 2)] || 1);
      if (size > 4) {
        const off = t + r32(ge + 8);
        if (off + size <= seg.length) seg.fill(0, off, off + size);
      }
    }
    seg.fill(0, gps, gps + 2 + m * 12 + 4); // entry count 0 + next-IFD 0 = valid empty IFD
  }
}

function stripJpeg(buf: Buffer) {
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // image data follows — copy the rest untouched
    const len = buf.readUInt16BE(i + 2);
    let seg = buf.subarray(i, i + 2 + len);
    if (marker === 0xe1) {
      if (seg.toString("latin1", 4, 10) === "Exif\0\0") {
        seg = Buffer.from(seg);
        wipeExifGps(seg, 10);
      } else if (seg.toString("latin1", 4, 32).startsWith("http://ns.adobe.com/xap/1.0/") && hasGpsText(seg)) {
        i += 2 + len; // drop XMP packets that carry location
        continue;
      }
    }
    out.push(seg);
    i += 2 + len;
  }
  out.push(buf.subarray(i));
  return Buffer.concat(out);
}

function stripPng(buf: Buffer) {
  const out: Buffer[] = [buf.subarray(0, 8)];
  for (let i = 8; i + 12 <= buf.length; ) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString("latin1", i + 4, i + 8);
    let chunk = buf.subarray(i, i + 12 + len);
    if (type === "eXIf") {
      // Wipe only the GPS block, then fix the chunk checksum.
      chunk = Buffer.from(chunk);
      wipeExifGps(chunk, 8);
      chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + len)), 8 + len);
    }
    const drop = ["iTXt", "tEXt", "zTXt"].includes(type) && hasGpsText(chunk);
    if (!drop) out.push(chunk);
    i += 12 + len;
  }
  return Buffer.concat(out);
}

// WebP keeps EXIF in its own chunk: wipe GPS inside it; drop XMP if it mentions location.
function stripWebp(buf: Buffer) {
  const out: Buffer[] = [Buffer.from(buf.subarray(0, 12))];
  let dropXmp = false;
  for (let i = 12; i + 8 <= buf.length; ) {
    const type = buf.toString("latin1", i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    const chunk = Buffer.from(buf.subarray(i, i + 8 + size + (size % 2)));
    if (type === "EXIF") wipeExifGps(chunk, chunk.toString("latin1", 8, 14) === "Exif\0\0" ? 14 : 8);
    if (type === "XMP " && hasGpsText(chunk)) dropXmp = true;
    else out.push(chunk);
    i += 8 + size + (size % 2);
  }
  if (dropXmp) {
    const vp8x = out.find((c) => c.toString("latin1", 0, 4) === "VP8X");
    if (vp8x) vp8x[8] &= ~0x04; // clear the XMP flag
  }
  const res = Buffer.concat(out);
  res.writeUInt32LE(res.length - 8, 4);
  return res;
}

export async function stripLocation(buf: Buffer, mime: string): Promise<Buffer> {
  try {
    if (mime === "image/jpeg") return stripJpeg(buf);
    if (mime === "image/png") return stripPng(buf);
    if (mime === "image/webp") return stripWebp(buf);
  } catch (e) {
    console.warn("[frameroom] couldn't strip location losslessly, re-encoding instead:", (e as Error).message);
  }
  // Fallback: re-encode at high quality; sharp drops all metadata by default.
  const img = sharp(buf).rotate();
  return mime === "image/png" ? img.png().toBuffer() : mime === "image/webp" ? img.webp({ quality: 95 }).toBuffer() : img.jpeg({ quality: 95 }).toBuffer();
}
