/** Keep README/SVG, PNG favicons, Apple icon and the multi-size ICO in sync. */
import { readFile, writeFile } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'

const svg = await readFile('src/app/icon.svg', 'utf8')
const sizes = [16, 32, 48, 64]
const images = sizes.map(size => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng())
await writeFile('public/calendra-icon-v11.png', images.at(-1))
await writeFile('public/calendra-apple-v11.png', new Resvg(svg, { fitTo: { mode: 'width', value: 180 } }).render().asPng())
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, index) => {
  const entry = 6 + index * 16
  header[entry] = size
  header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(images[index].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += images[index].length
})
await writeFile('src/app/favicon.ico', Buffer.concat([header, ...images]))
console.log('Built 16/32/48/64px ICO, 64px favicon and 180px Apple icon from the README logo.')
