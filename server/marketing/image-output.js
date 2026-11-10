import sharp from 'sharp'
import { Buffer } from 'node:buffer'

const MAX_INPUT_BYTES = 10 * 1024 * 1024
const decoderOptions = { limitInputPixels: 40_000_000, failOn: 'warning' }

// Preserve the entire composition: only resize matching ratios, never pad, crop or stretch.
export async function normalizeImageOutput(base64, preset) {
  if (typeof base64 !== 'string' || base64.length > Math.ceil(MAX_INPUT_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error('Generated image data is invalid or too large.')
  const source = Buffer.from(base64, 'base64')
  if (!source.length || source.length > MAX_INPUT_BYTES) throw new Error('Generated image exceeded the allowed size.')
  const metadata = await sharp(source, decoderOptions).metadata()
  if (!['jpeg', 'png', 'webp'].includes(metadata.format) || !metadata.width || !metadata.height || (metadata.pages || 1) !== 1) throw new Error('Generated output must be one supported static image.')
  const rotated = [5, 6, 7, 8].includes(metadata.orientation)
  const width = rotated ? metadata.height : metadata.width
  const height = rotated ? metadata.width : metadata.height
  const padded = width * preset.height !== height * preset.width
  if (padded) throw new Error(`The model returned the wrong aspect ratio. Retry to generate a full-frame ${preset.ratio} image without cropping or borders.`)
  // Preserve compliant JPEG bytes, avoiding an unnecessary lossy re-encode.
  if (metadata.format === 'jpeg' && !metadata.orientation && metadata.space === 'srgb' && width === preset.width && height === preset.height && source.length <= preset.maxBytes) {
    return { bytes: source, validation: result(source.length, false, false) }
  }
  for (const quality of [92, 85, 75, 65]) {
    const { data, info } = await sharp(source, decoderOptions).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb')
      .resize(preset.width, preset.height, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality, chromaSubsampling: '4:4:4' }).toBuffer({ resolveWithObject: true })
    if (info.width !== preset.width || info.height !== preset.height || info.format !== 'jpeg') throw new Error('Generated image failed output validation.')
    if (data.length <= preset.maxBytes) return { bytes: data, validation: result(data.length, padded, true) }
  }
  throw new Error('The image cannot meet the file-size limit. Please generate another draft.')

  function result(byteLength, padded, converted) {
    return { version: 1, format_id: preset.id, width: preset.width, height: preset.height, mime_type: 'image/jpeg', byte_length: byteLength,
      source_width: width, source_height: height, padded, converted, cropped: false }
  }
}

export function hasValidatedOutput(asset, preset) {
  const v = asset.image_validation
  return Boolean(preset && v?.version === 1 && v.format_id === preset.id && v.width === preset.width && v.height === preset.height && v.mime_type === 'image/jpeg' && v.byte_length > 0 && v.byte_length <= preset.maxBytes)
}
