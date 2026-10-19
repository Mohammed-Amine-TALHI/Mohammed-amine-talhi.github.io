/** Generate web-app PNGs plus a real multi-size favicon.ico from the master. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../public/profile-icon-master.png', import.meta.url));
const publicDir = new URL('../public/', import.meta.url);
const sizes = [16, 32, 48];
const pngs = [];

for (const size of sizes) {
  pngs.push(await sharp(source).resize(size, size).png().toBuffer());
}

await sharp(source).resize(192, 192).png().toFile(fileURLToPath(new URL('icon-192.png', publicDir)));
await sharp(source).resize(512, 512).png().toFile(fileURLToPath(new URL('icon-512.png', publicDir)));
await sharp(source).resize(180, 180).png().toFile(fileURLToPath(new URL('apple-touch-icon.png', publicDir)));
await sharp(source).resize(64, 64).png().toFile(fileURLToPath(new URL('favicon.png', publicDir)));

// ICO supports embedded PNG payloads. This builds the header and directory
// explicitly so no extra image package is needed.
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pngs.forEach((png, index) => {
  const size = sizes[index];
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header[entry + 2] = 0;
  header[entry + 3] = 0;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
writeFileSync(fileURLToPath(new URL('favicon.ico', publicDir)), Buffer.concat([header, ...pngs]));

console.log('Generated favicon.ico and 64, 180, 192, and 512 px app icons.');
