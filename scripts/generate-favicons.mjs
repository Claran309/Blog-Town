import sharp from 'sharp';

const source = 'public/assets/profile/logo.webp';
const outputs = [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];

await Promise.all(outputs.map(([destination, size]) => sharp(source)
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(destination)));
