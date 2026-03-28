const PLATFORM_STYLES = {
  instagram: { label: 'IG', bg: 'bg-pink-900', text: 'text-pink-300' },
  facebook:  { label: 'FB', bg: 'bg-blue-900',  text: 'text-blue-300' },
  x:         { label: 'X',  bg: 'bg-gray-800',  text: 'text-gray-300' },
  linkedin:  { label: 'LI', bg: 'bg-sky-900',   text: 'text-sky-300' },
  pinterest: { label: 'PIN',bg: 'bg-red-900',   text: 'text-red-300' },
  whatsapp:  { label: 'WA', bg: 'bg-green-900', text: 'text-green-300' },
}

export default function PlatformBadge({ platform }) {
  const style = PLATFORM_STYLES[platform] ?? { label: platform, bg: 'bg-gray-800', text: 'text-gray-300' }
  return (
    <span className={`${style.bg} ${style.text} text-xs font-semibold px-2 py-0.5 rounded`}>
      {style.label}
    </span>
  )
}
