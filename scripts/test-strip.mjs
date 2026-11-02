// Dev check for GPS stripping: `node scripts/test-strip.mjs <outDir>` writes JPEG/PNG/WebP files
// that contain GPS coordinates. Upload them, download the originals, and confirm GPS is gone.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = process.argv[2] || "./gps-test";
mkdirSync(out, { recursive: true });
const exif = {
  IFD0: { Make: "TestCam", Model: "GPS Check" },
  IFD3: { GPSLatitudeRef: "N", GPSLatitude: "40/1 26/1 4600/100", GPSLongitudeRef: "W", GPSLongitude: "79/1 58/1 5600/100" },
};
const base = sharp({ create: { width: 640, height: 480, channels: 3, background: "#c85a32" } });
writeFileSync(path.join(out, "gps.jpg"), await base.clone().jpeg().withExif(exif).toBuffer());
writeFileSync(path.join(out, "gps.png"), await base.clone().png().withExif(exif).toBuffer());
writeFileSync(path.join(out, "gps.webp"), await base.clone().webp().withExif(exif).toBuffer());
console.log(`Wrote gps.jpg, gps.png, gps.webp to ${out}`);
