/**
 * Generate minimal valid PNG icons for PWA.
 * Run: node scripts/generate-png-icons.js
 * 
 * Creates solid dark background PNGs with correct dimensions.
 * Replace with properly designed icons later.
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const outDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function createPNG(width, height, r, g, b) {
  // Create raw pixel data (RGBA)
  const rowSize = width * 4 + 1 // +1 for filter byte
  const rawData = Buffer.alloc(rowSize * height)

  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const offset = y * rowSize + 1 + x * 4
      // Simple rounded rect: dark bg with orange border
      const margin = Math.round(width * 0.08)
      const borderW = Math.round(width * 0.03)
      const isInBorder =
        (x >= margin && x < margin + borderW && y >= margin && y < height - margin) ||
        (x >= width - margin - borderW && x < width - margin && y >= margin && y < height - margin) ||
        (y >= margin && y < margin + borderW && x >= margin && x < width - margin) ||
        (y >= height - margin - borderW && y < height - margin && x >= margin && x < width - margin)

      // "M" shape in center
      const cx = width / 2
      const cy = height * 0.42
      const letterSize = width * 0.3
      const letterW = width * 0.04
      const dx = Math.abs(x - cx)
      const dy = y - (cy - letterSize / 2)
      const isInM =
        dy >= 0 && dy <= letterSize && (
          // Left vertical
          (x >= cx - letterSize / 2 && x < cx - letterSize / 2 + letterW) ||
          // Right vertical
          (x >= cx + letterSize / 2 - letterW && x < cx + letterSize / 2) ||
          // Left diagonal
          (Math.abs(x - (cx - letterSize / 4) - (dy / letterSize) * (letterSize / 4)) < letterW && dy < letterSize * 0.5) ||
          // Right diagonal
          (Math.abs(x - (cx + letterSize / 4) + (dy / letterSize) * (letterSize / 4)) < letterW && dy < letterSize * 0.5)
        )

      if (isInM) {
        rawData[offset] = 249     // R (orange)
        rawData[offset + 1] = 115 // G
        rawData[offset + 2] = 22  // B
        rawData[offset + 3] = 255
      } else if (isInBorder) {
        rawData[offset] = 249     // R (orange)
        rawData[offset + 1] = 115 // G
        rawData[offset + 2] = 22  // B
        rawData[offset + 3] = 255
      } else {
        rawData[offset] = r
        rawData[offset + 1] = g
        rawData[offset + 2] = b
        rawData[offset + 3] = 255
      }
    }
  }

  const compressed = zlib.deflateSync(rawData)

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeB = Buffer.from(type)
    const crc = crc32(Buffer.concat([typeB, data]))
    const crcB = Buffer.alloc(4)
    crcB.writeUInt32BE(crc >>> 0)
    return Buffer.concat([len, typeB, data, crcB])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const iend = Buffer.alloc(0)

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ])
}

// CRC32 for PNG chunks
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Generate icons
const sizes = [192, 512]
for (const size of sizes) {
  const png = createPNG(size, size, 12, 12, 15) // #0c0c0f background
  const filePath = path.join(outDir, `icon-${size}x${size}.png`)
  fs.writeFileSync(filePath, png)
  console.log(`Created ${filePath} (${png.length} bytes)`)
}

console.log('\nDone! Replace these with properly designed icons later.')
