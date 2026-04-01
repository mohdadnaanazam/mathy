/**
 * Quick script to generate PWA icon PNGs from an SVG template.
 * Run: node scripts/generate-icons.js
 *
 * Creates public/icons/icon-192x192.png and public/icons/icon-512x512.png
 * Uses a simple canvas-based approach (no external deps needed).
 *
 * NOTE: Replace these generated icons with proper designed icons later.
 */

const fs = require('fs')
const path = require('path')

const sizes = [192, 512]
const outDir = path.join(__dirname, '..', 'public', 'icons')

// Simple 1x1 orange pixel PNG as a minimal placeholder
// In production, replace with actual designed icons
function createMinimalPNG(size) {
  // SVG with Mathy branding colors
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0c0c0f"/>
  <rect x="${Math.round(size * 0.05)}" y="${Math.round(size * 0.05)}" width="${Math.round(size * 0.9)}" height="${Math.round(size * 0.9)}" rx="${Math.round(size * 0.15)}" fill="none" stroke="#f97316" stroke-width="${Math.round(size * 0.02)}"/>
  <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="${Math.round(size * 0.35)}" fill="#f97316">M</text>
  <text x="50%" y="72%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="${Math.round(size * 0.1)}" fill="#a1a1aa">mathy</text>
</svg>`
  return svg
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

for (const size of sizes) {
  const svg = createMinimalPNG(size)
  const svgPath = path.join(outDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(svgPath, svg)
  console.log(`Created ${svgPath}`)
}

console.log('\nSVG icons created. For production PNG icons:')
console.log('1. Design proper icons or use a tool like https://realfavicongenerator.net')
console.log('2. Replace the SVG files with PNG files in public/icons/')
console.log('3. Or convert these SVGs to PNG using: npx svgexport icon.svg icon.png')
