// Conservative export presets, separate from the image tool's supported sizes.
const formats = {
  'feed-square': { label: 'Feed · Square', width: 1080, height: 1080, ratio: '1:1', modelSize: '1024x1024', placement: 'feed' },
  'feed-portrait': { label: 'Feed · Portrait', width: 1080, height: 1350, ratio: '4:5', modelSize: '1024x1536', placement: 'feed' },
  story: { label: 'Story', width: 1080, height: 1920, ratio: '9:16', modelSize: '1152x2048', imageModel: 'gpt-image-2', fullFrame: true, placement: 'story' },
  'reel-cover': { label: 'Reel cover (image only)', width: 1080, height: 1920, ratio: '9:16', modelSize: '1152x2048', imageModel: 'gpt-image-2', fullFrame: true, placement: 'reel-cover' },
}
export const IMAGE_PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn']
export const IMAGE_FORMATS = IMAGE_PLATFORMS.flatMap(platform => {
  const entries = platform === 'LinkedIn'
    ? { 'feed-square': { ...formats['feed-square'], width: 1200, height: 1200 }, 'feed-portrait': formats['feed-portrait'], 'feed-landscape': { label: 'Feed · Landscape', width: 1200, height: 628, ratio: '300:157', modelSize: '1536x1024', placement: 'feed' } }
    : formats
  return Object.entries(entries).map(([key, spec]) => ({ ...spec, id: `${platform.toLowerCase()}-${key}`, platform, maxBytes: 5_000_000,
    sharedFeed: spec.placement === 'feed' && spec.width / spec.height <= 1.91,
  }))
})
export const DEFAULT_IMAGE_FORMAT = 'instagram-feed-portrait'
export function getImageFormat(id) { return IMAGE_FORMATS.find(format => format.id === id) || null }
