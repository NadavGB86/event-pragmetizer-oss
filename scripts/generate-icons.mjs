/**
 * PWA Icon Generator — No external dependencies
 * Generates icon-192.png and icon-512.png using only Node.js built-ins.
 * Creates a white calendar-check symbol on an indigo (#4F46E5) rounded background.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');

// Colors
const INDIGO = [79, 70, 229]; // #4F46E5
const WHITE = [255, 255, 255];
const BG = [241, 245, 249]; // #f1f5f9 (background_color from manifest)

// --- PNG encoder (minimal, RGBA) ---

function crc32(buf) {
  let table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const payload = Buffer.concat([typeBytes, data]);
  const crcVal = crc32(payload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, payload, crcBuf]);
}

function encodePNG(width, height, pixels) {
  // pixels is a Uint8Array of RGBA values, row by row
  // Add filter byte (0 = None) before each row
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(Buffer.from([0])); // filter none
    rawRows.push(Buffer.from(pixels.buffer, y * width * 4, width * 4));
  }
  const raw = Buffer.concat(rawRows);
  const compressed = deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

// --- Drawing helpers ---

function setPixel(pixels, width, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= width) return;
  const idx = (y * width + x) * 4;
  // Alpha blend
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  pixels[idx + 0] = Math.round((r * srcA + pixels[idx + 0] * dstA * (1 - srcA)) / outA);
  pixels[idx + 1] = Math.round((g * srcA + pixels[idx + 1] * dstA * (1 - srcA)) / outA);
  pixels[idx + 2] = Math.round((b * srcA + pixels[idx + 2] * dstA * (1 - srcA)) / outA);
  pixels[idx + 3] = Math.round(outA * 255);
}

function fillRect(pixels, size, x1, y1, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(pixels, size, x1 + dx, y1 + dy, r, g, b, a);
    }
  }
}

function fillRoundedRect(pixels, size, x, y, w, h, radius, r, g, b) {
  // Fill the main body (without corners)
  fillRect(pixels, size, x + radius, y, w - 2 * radius, h, r, g, b);
  fillRect(pixels, size, x, y + radius, w, h - 2 * radius, r, g, b);

  // Fill rounded corners using circle distance
  const corners = [
    [x + radius, y + radius],             // top-left
    [x + w - radius - 1, y + radius],     // top-right
    [x + radius, y + h - radius - 1],     // bottom-left
    [x + w - radius - 1, y + h - radius - 1], // bottom-right
  ];
  for (const [cx, cy] of corners) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + 0.5) {
          const alpha = dist > radius - 0.5 ? Math.round((radius + 0.5 - dist) * 255) : 255;
          setPixel(pixels, size, cx + dx, cy + dy, r, g, b, alpha);
        }
      }
    }
  }
}

function fillCircle(pixels, size, cx, cy, radius, r, g, b) {
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius + 0.5) {
        const alpha = dist > radius - 0.5 ? Math.round((radius + 0.5 - dist) * 255) : 255;
        setPixel(pixels, size, Math.round(cx + dx), Math.round(cy + dy), r, g, b, alpha);
      }
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, thickness, r, g, b) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const halfT = thickness / 2;

  // Bounding box
  const minX = Math.floor(Math.min(x1, x2) - halfT - 1);
  const maxX = Math.ceil(Math.max(x1, x2) + halfT + 1);
  const minY = Math.floor(Math.min(y1, y2) - halfT - 1);
  const maxY = Math.ceil(Math.max(y1, y2) + halfT + 1);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      // Distance from point to line segment
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
      const projX = x1 + t * dx;
      const projY = y1 + t * dy;
      const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
      if (dist <= halfT + 0.5) {
        const alpha = dist > halfT - 0.5 ? Math.round((halfT + 0.5 - dist) * 255) : 255;
        setPixel(pixels, size, px, py, r, g, b, alpha);
      }
    }
  }
}

// --- Icon drawing ---

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Fill background transparent
  pixels.fill(0);

  // Draw rounded indigo background
  const margin = Math.round(size * 0.06);
  const bgSize = size - margin * 2;
  const radius = Math.round(size * 0.18);
  fillRoundedRect(pixels, size, margin, margin, bgSize, bgSize, radius, ...INDIGO);

  // Calendar body dimensions (relative to icon size)
  const calLeft = Math.round(size * 0.22);
  const calTop = Math.round(size * 0.26);
  const calWidth = Math.round(size * 0.56);
  const calHeight = Math.round(size * 0.52);
  const calRadius = Math.round(size * 0.05);
  const headerHeight = Math.round(size * 0.12);
  const lineW = Math.max(2, Math.round(size * 0.035));

  // Calendar body (white rounded rect)
  fillRoundedRect(pixels, size, calLeft, calTop, calWidth, calHeight, calRadius, ...WHITE);

  // Calendar header bar (slightly darker white / light indigo area at top)
  // We'll make the top portion have a subtle indigo tint
  const headerColor = [199, 196, 243]; // light indigo
  fillRect(pixels, size, calLeft + calRadius, calTop, calWidth - calRadius * 2, headerHeight, ...headerColor);
  fillRect(pixels, size, calLeft, calTop + calRadius, calWidth, headerHeight - calRadius, ...headerColor);
  // Re-round just the top corners
  const topCorners = [
    [calLeft + calRadius, calTop + calRadius],
    [calLeft + calWidth - calRadius - 1, calTop + calRadius],
  ];
  for (const [cx, cy] of topCorners) {
    for (let dy = -calRadius; dy <= 0; dy++) {
      for (let dx = -calRadius; dx <= calRadius; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= calRadius + 0.5) {
          const alpha = dist > calRadius - 0.5 ? Math.round((calRadius + 0.5 - dist) * 255) : 255;
          setPixel(pixels, size, cx + dx, cy + dy, ...headerColor, alpha);
        }
      }
    }
  }

  // Calendar pins (two small circles on top of header)
  const pinRadius = Math.round(size * 0.025);
  const pinY = calTop - Math.round(size * 0.01);
  const pin1X = calLeft + Math.round(calWidth * 0.3);
  const pin2X = calLeft + Math.round(calWidth * 0.7);
  fillCircle(pixels, size, pin1X, pinY, pinRadius, ...WHITE);
  fillCircle(pixels, size, pin2X, pinY, pinRadius, ...WHITE);

  // Checkmark inside the calendar body (below the header)
  const checkCX = calLeft + calWidth / 2;
  const checkCY = calTop + headerHeight + (calHeight - headerHeight) / 2 + Math.round(size * 0.02);
  const checkSize = Math.round(size * 0.14);

  // Checkmark: two lines forming a V-shape pointing down-right
  const checkStartX = checkCX - checkSize;
  const checkStartY = checkCY - Math.round(checkSize * 0.1);
  const checkMidX = checkCX - Math.round(checkSize * 0.3);
  const checkMidY = checkCY + Math.round(checkSize * 0.6);
  const checkEndX = checkCX + checkSize;
  const checkEndY = checkCY - Math.round(checkSize * 0.5);

  // Use indigo for the checkmark
  drawLine(pixels, size, checkStartX, checkStartY, checkMidX, checkMidY, lineW, ...INDIGO);
  drawLine(pixels, size, checkMidX, checkMidY, checkEndX, checkEndY, lineW, ...INDIGO);

  return encodePNG(size, size, pixels);
}

// --- Generate both sizes ---

const icon192 = drawIcon(192);
const icon512 = drawIcon(512);

const path192 = resolve(PUBLIC_DIR, 'icon-192.png');
const path512 = resolve(PUBLIC_DIR, 'icon-512.png');

writeFileSync(path192, icon192);
writeFileSync(path512, icon512);

console.log(`Created: ${path192} (${icon192.length} bytes)`);
console.log(`Created: ${path512} (${icon512.length} bytes)`);
