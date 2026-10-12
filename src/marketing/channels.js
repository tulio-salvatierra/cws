export const MARKETING_PLATFORMS = ['LINKEDIN', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_BUSINESS']
export const MARKETING_CAPTION_LIMIT = 1500
export const GOOGLE_BUSINESS_CTA_URL = 'https://cicerowebstudio.xyz/'
export function marketingPlatformName(platform) {
  return { LINKEDIN: 'LinkedIn', FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', GOOGLE_BUSINESS: 'Google Business Profile' }[platform] || platform
}
export function marketingDestinationsVerified(destinations) {
  return destinations.length === MARKETING_PLATFORMS.length
    && MARKETING_PLATFORMS.every(platform => destinations.some(destination => destination.platform === platform && destination.verification_state === 'verified'))
}
