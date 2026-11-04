import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { it } from 'node:test'

it('auth panels rely on the site header instead of repeating its wordmark', () => {
  const panel = readFileSync('src/components/site/AuthPanel.tsx', 'utf8')
  assert.equal(panel.includes('CalendraLogo'), false)
  assert.equal(
    panel.includes('across devices'),
    true,
    'storage limitation must remain explicit',
  )
  assert.equal(panel.includes('not synced across devices'), true)
})

it('removes the requested landing caption', () => {
  assert.equal(
    readFileSync('src/app/page.tsx', 'utf8').includes(
      'Every layer below is a real constraint',
    ),
    false,
  )
})

it('ships a calendar SVG and a matching PNG-backed ICO rather than the starter favicon', () => {
  const svg = readFileSync('src/app/icon.svg', 'utf8')
  assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/)
  assert.match(svg, /aria-label="Calendra"/)
  assert.match(svg, /#173BB5/)
  const ico = readFileSync('src/app/favicon.ico')
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 4)
  let expectedOffset = 6 + 4 * 16
  for (const [index, size] of [16, 32, 48, 64].entries()) {
    const entry = 6 + index * 16
    assert.equal(ico[entry], size)
    assert.equal(ico[entry + 1], size)
    const length = ico.readUInt32LE(entry + 8)
    const offset = ico.readUInt32LE(entry + 12)
    assert.equal(offset, expectedOffset)
    const png = ico.subarray(offset, offset + length)
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(png.readUInt32BE(16), size)
    assert.equal(png.readUInt32BE(20), size)
    if (size === 64) assert.deepEqual(png, readFileSync('public/calendra-icon-v11.png'))
    expectedOffset += length
  }
  assert.equal(expectedOffset, ico.length)
})

it('keeps internal docs off the public website and moves legal links to their own page', () => {
  const docs = readFileSync('src/app/docs/page.tsx', 'utf8')
  assert.match(docs, /notFound\(\)/)
  for (const file of [
    'src/components/site/SiteHeader.tsx',
    'src/components/site/SiteFooter.tsx',
    'src/components/site/AuthPanel.tsx',
  ]) {
    assert.equal(readFileSync(file, 'utf8').includes('/docs'), false, file)
  }
  assert.equal(docs.includes('MEMORY.md'), false)
  assert.equal(
    readFileSync('src/app/legal/page.tsx', 'utf8').includes('Privacy notice'),
    true,
  )
})

it('explicitly links a versioned PNG favicon and an Apple touch icon', () => {
  const layout = readFileSync('src/app/layout.tsx', 'utf8')
  for (const name of ['calendra-icon-v11.png', 'calendra-apple-v11.png']) {
    assert.equal(layout.includes('/' + name), true)
    assert.equal(
      readFileSync('public/' + name)
        .subarray(0, 8)
        .toString('hex'),
      '89504e470d0a1a0a',
    )
  }
})

it('keeps implementation notes out of customer-facing auth and pricing copy', () => {
  const auth = readFileSync('src/components/site/AuthPanel.tsx', 'utf8')
  assert.equal(
    auth.includes('A real signed session with a clearly-labelled identity'),
    false,
  )
  assert.equal(
    auth.includes('a real signed session with a labelled identity'),
    false,
  )
  assert.equal(auth.includes('demo@calendra.local'), false)
  assert.equal(auth.includes('This deployment cannot see'), false)
  const pricing = readFileSync('src/components/landing/Landing.jsx', 'utf8')
  assert.equal(pricing.includes('Adding API keys alone'), false)
  assert.match(pricing, /enquiries only;\s+no\s+checkout\s+or payment is taken/)
})


it('keeps README minimal with a centered app logo above its title and no internal doc links', () => {
  const readme = readFileSync('README.md', 'utf8')
  assert.ok(readme.indexOf('<img ') < readme.indexOf('<h1>Calendra</h1>'))
  assert.match(readme, /<div align="center">/)
  assert.match(readme, /src="src\/app\/icon.svg" alt="Calendra logo"/)
  assert.ok(readme.split('\n').length <= 35)
  assert.doesNotMatch(readme, /docs\/|Honest by construction|diorama|paper texture|\/docs/)
  assert.match(readme, /npm install/)
  assert.match(readme, /npm run dev/)
})
