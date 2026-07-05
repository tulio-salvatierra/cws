const CLASH_FONTS = [
  '600 1em Clash',
  '400 1em Clash',
  '700 1em Clash',
] as const

export async function waitForAppFonts() {
  await Promise.all(CLASH_FONTS.map((font) => document.fonts.load(font)))
  await document.fonts.ready
}
