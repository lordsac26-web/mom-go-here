/**
 * Music genre definitions for the ambient music player.
 * Each genre has a Radio Browser API tag and curated fallback streams.
 */

const MUSIC_GENRES = [
  {
    key: "ambient",
    label: "Ambient / Chill",
    emoji: "🌌",
    tag: "ambient",
    fallbacks: [
      "https://ice6.somafm.com/dronezone-128-mp3",
      "https://ice6.somafm.com/deepspaceone-128-mp3",
      "https://ice2.somafm.com/ambient-128-mp3",
    ],
  },
  {
    key: "relaxation",
    label: "Relaxation / Spa",
    emoji: "🧘",
    tag: "relaxation",
    fallbacks: [
      "https://streams.calmradio.com/api/39/128/stream",
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "classical",
    label: "Classical",
    emoji: "🎻",
    tag: "classical",
    fallbacks: [
      "https://live.musopen.org:8085/streamvbr0",
      "https://stream.srg-ssr.ch/m/rsc_de/mp3_128",
    ],
  },
  {
    key: "jazz",
    label: "Jazz",
    emoji: "🎷",
    tag: "jazz",
    fallbacks: [
      "https://ice4.somafm.com/secretagent-128-mp3",
      "https://streaming.radio.co/s774887f7b/listen",
    ],
  },
  {
    key: "piano",
    label: "Piano",
    emoji: "🎹",
    tag: "piano",
    fallbacks: [
      "https://ice4.somafm.com/spacestation-128-mp3",
    ],
  },
  {
    key: "oriental",
    label: "Oriental / Chinese",
    emoji: "🏮",
    tag: "chinese",
    fallbacks: [
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    key: "hindi",
    label: "Hindi / Bollywood",
    emoji: "🪷",
    tag: "hindi",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "arabic",
    label: "Arabian / Middle Eastern",
    emoji: "🕌",
    tag: "arabic",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "celtic",
    label: "Celtic / Scottish",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    tag: "celtic",
    fallbacks: [
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    key: "folk",
    label: "American Folk",
    emoji: "🪕",
    tag: "folk",
    fallbacks: [
      "https://ice4.somafm.com/folkfwd-128-mp3",
    ],
  },
  {
    key: "country",
    label: "Country",
    emoji: "🤠",
    tag: "country",
    fallbacks: [
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    key: "latin",
    label: "Latin / Tropical",
    emoji: "💃",
    tag: "latin",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "bossa",
    label: "Bossa Nova",
    emoji: "🇧🇷",
    tag: "bossa nova",
    fallbacks: [
      "https://ice4.somafm.com/secretagent-128-mp3",
    ],
  },
  {
    key: "reggae",
    label: "Reggae",
    emoji: "🇯🇲",
    tag: "reggae",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "african",
    label: "African",
    emoji: "🌍",
    tag: "african",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "japanese",
    label: "Japanese",
    emoji: "🗾",
    tag: "japanese",
    fallbacks: [
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    key: "korean",
    label: "K-Pop / Korean",
    emoji: "🇰🇷",
    tag: "kpop",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "lofi",
    label: "Lo-Fi Beats",
    emoji: "📻",
    tag: "lofi",
    fallbacks: [
      "https://ice4.somafm.com/spacestation-128-mp3",
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
  {
    key: "nature",
    label: "Nature Sounds",
    emoji: "🌿",
    tag: "nature",
    fallbacks: [
      "https://streams.calmradio.com/api/39/128/stream",
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "gospel",
    label: "Gospel / Spiritual",
    emoji: "⛪",
    tag: "gospel",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "flamenco",
    label: "Flamenco / Spanish",
    emoji: "🇪🇸",
    tag: "flamenco",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "greek",
    label: "Greek",
    emoji: "🇬🇷",
    tag: "greek",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "italian",
    label: "Italian",
    emoji: "🇮🇹",
    tag: "italian",
    fallbacks: [
      "https://radio.stereoscenic.com/asp-s",
    ],
  },
  {
    key: "meditation",
    label: "Meditation / Zen",
    emoji: "🔔",
    tag: "meditation",
    fallbacks: [
      "https://streams.calmradio.com/api/39/128/stream",
      "https://ice6.somafm.com/dronezone-128-mp3",
    ],
  },
];

export default MUSIC_GENRES;