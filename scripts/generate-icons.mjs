// Generate the RepoDock icon set as PNGs with zero external dependencies.
//
// The icon mirrors the in-app logo: a rounded blue tile with a bright "dock bar"
// near the top and two muted context lines beneath it. PNGs are encoded by hand
// using Node's built-in zlib, so there is no image-library build dependency.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icon');
const SIZES = [16, 32, 48, 96, 128];

// Palette (GitHub Primer blues).
const ACCENT_TOP = [31, 111, 235]; // #1f6feb
const ACCENT_BOTTOM = [9, 105, 218]; // #0969da
const BAR = [255, 255, 255];
const LINE = [197, 218, 247];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

/** CRC-32 (PNG polynomial). */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Whether (x, y) lies inside a square of side `n` with corner radius `r`. */
function insideRounded(x, y, n, r) {
  const cx = x + 0.5;
  const cy = y + 0.5;
  const minX = r;
  const maxX = n - r;
  const minY = r;
  const maxY = n - r;
  let dx = 0;
  let dy = 0;
  if (cx < minX) dx = minX - cx;
  else if (cx > maxX) dx = cx - maxX;
  if (cy < minY) dy = minY - cy;
  else if (cy > maxY) dy = cy - maxY;
  return dx * dx + dy * dy <= r * r;
}

function renderPixels(n) {
  const radius = Math.max(2, Math.round(n * 0.22));
  const pixels = Buffer.alloc(n * n * 4, 0);

  // Geometry of the bars, proportional to the icon size.
  const inset = Math.round(n * 0.2);
  const barTop = Math.round(n * 0.26);
  const barHeight = Math.max(2, Math.round(n * 0.12));
  const lineTop1 = Math.round(n * 0.52);
  const lineTop2 = Math.round(n * 0.7);
  const lineHeight = Math.max(1, Math.round(n * 0.08));

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const offset = (y * n + x) * 4;
      if (!insideRounded(x, y, n, radius)) continue;

      const t = (x + y) / (2 * n);
      let r = lerp(ACCENT_TOP[0], ACCENT_BOTTOM[0], t);
      let g = lerp(ACCENT_TOP[1], ACCENT_BOTTOM[1], t);
      let b = lerp(ACCENT_TOP[2], ACCENT_BOTTOM[2], t);

      const inBar = x >= inset && x < n - inset && y >= barTop && y < barTop + barHeight;
      const inLine1 =
        x >= inset &&
        x < n - inset - Math.round(n * 0.12) &&
        y >= lineTop1 &&
        y < lineTop1 + lineHeight;
      const inLine2 =
        x >= inset &&
        x < n - inset - Math.round(n * 0.26) &&
        y >= lineTop2 &&
        y < lineTop2 + lineHeight;

      if (inBar) [r, g, b] = BAR;
      else if (inLine1 || inLine2) [r, g, b] = LINE;

      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

function encodePng(n, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Prefix each scanline with filter byte 0 (None).
  const stride = n * 4;
  const raw = Buffer.alloc((stride + 1) * n);
  for (let y = 0; y < n; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const png = encodePng(size, renderPixels(size));
  writeFileSync(resolve(OUT_DIR, `${size}.png`), png);
  process.stdout.write(`icon/${size}.png (${png.length} bytes)\n`);
}
process.stdout.write(`Wrote ${SIZES.length} icons to ${OUT_DIR}\n`);
