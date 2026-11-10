// @vitest-environment node
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { Buffer } from 'node:buffer'
import { IMAGE_FORMATS, getImageFormat } from '../../../src/marketing/imageFormats.js'
import { hasValidatedOutput, normalizeImageOutput } from '../image-output.js'

const makeImage = (width, height) => sharp({ create: { width, height, channels: 4, background: '#ff0000' } }).png().toBuffer()

describe('social image exports', () => {
  it.each(IMAGE_FORMATS)('validates actual bytes for $id', async preset => {
    const source = await makeImage(...preset.modelSize.split('x').map(Number))
    const result = await normalizeImageOutput(source.toString('base64'), preset)
    const actual = await sharp(result.bytes).metadata()
    expect(actual).toMatchObject({ width: preset.width, height: preset.height, format: 'jpeg', space: 'srgb' })
    expect(result.bytes.length).toBeLessThanOrEqual(preset.maxBytes)
    expect(hasValidatedOutput({ image_validation: result.validation }, preset)).toBe(true)
    expect(result.validation.cropped).toBe(false)
  })

  it.each(IMAGE_FORMATS)('rejects wrong-ratio output instead of padding $id', async preset => {
    await expect(normalizeImageOutput((await makeImage(100, 110)).toString('base64'), preset)).rejects.toThrow(/wrong aspect ratio/)
  })

  it.each(IMAGE_FORMATS)('requests an exact supported native ratio for $id', preset => {
    const [width, height] = preset.modelSize.split('x').map(Number)
    expect(width * preset.height).toBe(height * preset.width)
    expect(width % 16).toBe(0)
    expect(height % 16).toBe(0)
    expect(Math.max(width, height)).toBeLessThanOrEqual(3840)
    expect(width * height).toBeGreaterThanOrEqual(655360)
    expect(width * height).toBeLessThanOrEqual(8294400)
    expect(preset.imageModel).toBe('gpt-image-2')
  })

  it('rejects mismatched Story output instead of adding borders and preserves edge content for 9:16', async () => {
    const preset = getImageFormat('instagram-story')
    await expect(normalizeImageOutput((await makeImage(100, 150)).toString('base64'), preset)).rejects.toThrow(/wrong aspect ratio/)
    const result = await normalizeImageOutput((await makeImage(144, 256)).toString('base64'), preset)
    expect(result.validation).toMatchObject({ width: 1080, height: 1920, padded: false, cropped: false })
    const pixel = await sharp(result.bytes).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer()
    expect(pixel[0]).toBeGreaterThan(250)
    expect(pixel[1]).toBeLessThan(5)
  })

  it('preserves an already compliant JPEG byte for byte', async () => {
    const source = await sharp(await makeImage(1080, 1080)).jpeg().toBuffer()
    const result = await normalizeImageOutput(source.toString('base64'), getImageFormat('facebook-feed-square'))
    expect(result.bytes.equals(source)).toBe(true)
    expect(result.validation.converted).toBe(false)
  })

  it('honors EXIF orientation and flattens transparency', async () => {
    const source = await sharp({ create: { width: 135, height: 108, channels: 4, background: '#00000000' } }).png().withMetadata({ orientation: 6 }).toBuffer()
    const result = await normalizeImageOutput(source.toString('base64'), getImageFormat('instagram-feed-portrait'))
    expect(result.validation).toMatchObject({ source_width: 108, source_height: 135, padded: false })
    expect(await sharp(result.bytes).metadata()).toMatchObject({ hasAlpha: false })
  })

  it('rejects corrupt, unsupported, oversized, and impossible-to-compress images', async () => {
    const preset = getImageFormat('instagram-feed-square')
    await expect(normalizeImageOutput('not base64!', preset)).rejects.toThrow()
    await expect(normalizeImageOutput(Buffer.from('not an image').toString('base64'), preset)).rejects.toThrow()
    await expect(normalizeImageOutput('a'.repeat(14_000_000), preset)).rejects.toThrow()
    await expect(normalizeImageOutput(Buffer.from('<svg width="10" height="10"></svg>').toString('base64'), preset)).rejects.toThrow()
    await expect(normalizeImageOutput((await makeImage(100, 100)).toString('base64'), { ...preset, maxBytes: 1 })).rejects.toThrow(/file-size/)
  })

  it('excludes unsupported LinkedIn placements and keeps tall images out of the shared feed', () => {
    expect(getImageFormat('linkedin-story')).toBeNull()
    expect(getImageFormat('linkedin-reel-cover')).toBeNull()
    expect(IMAGE_FORMATS.filter(p => p.sharedFeed).every(p => p.placement === 'feed' && p.width / p.height >= 0.8 && p.width / p.height <= 1.91)).toBe(true)
  })
})
