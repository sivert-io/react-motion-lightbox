import type { LightboxItem } from 'react-motion-lightbox'

/** A photo on this page: what the lightbox needs, plus the square thumbnail and the credit. */
export interface Photo extends LightboxItem {
  thumb: string
  photographer: string
  profile: string
  /** What the album's square is centred on, as fractions of the photo. Default the middle. */
  focus?: [number, number]
  /** How far the square zooms in on it. 1 is the biggest square that fits. */
  zoom?: number
}

type Framing = Pick<Photo, 'focus' | 'zoom'>

// Each photo comes in three widths and a 480px square. The lightbox gets all
// three widths as a srcset, so a phone downloads the small one and a 4K
// screen the big one.
const photo = (
  id: string,
  width: number,
  height: number,
  alt: string,
  photographer: string,
  username: string,
  framing: Framing = {},
): Photo => ({
  kind: 'image',
  src: `/photos/${id}-1280.webp`,
  srcSet: `/photos/${id}-1280.webp 1280w, /photos/${id}-2560.webp 2560w, /photos/${id}-3840.webp 3840w`,
  sizes: '100vw',
  width,
  height,
  alt,
  thumb: `/photos/${id}-thumb.webp`,
  photographer,
  profile: `https://unsplash.com/@${username}`,
  ...framing,
})

export interface Album {
  id: string
  title: string
  blurb: string
  photos: Photo[]
}

export const ALBUMS: Album[] = [
  {
    id: "norway",
    title: "Norway",
    blurb: "Fjords, fishing villages and a lot of standing on rocks.",
    photos: [
      photo("p2D3wsu5pQM", 5200, 3464, "A river running through a valley between mountains", "admiratio", "admiratio", { focus: [0.78, 0.45], zoom: 1.6 }),
      photo("25Bu6uO9xLw", 6000, 4000, "Nusfjord, a fishing village in Lofoten", "Danny Rienecker", "danny_rienecker", { focus: [0.4, 0.62], zoom: 1.5 }),
      photo("ILYVeUgPkmI", 4928, 3264, "Trolltunga", "Dong Zhang", "perfumekiller", { focus: [0.3, 0.62], zoom: 1.4 }),
      photo("ut7XZMquCoU", 6038, 4025, "Houses by the water in Lofoten", "Benoît Deschasaux", "benowa", { focus: [0.68, 0.68], zoom: 1.8 }),
      photo("cKBsq-5U17A", 3358, 2239, "Man standing on a cliff over a river", "Robert Bye", "robertbye", { focus: [0.28, 0.35], zoom: 2.5 }),
      photo("QMtI1dZ6KJM", 6192, 4128, "A mountain lake reflecting the peaks", "Roger Benz", "robe76"),
      photo("N9vsB6OEeKM", 6000, 4000, "Trees beside a lake", "Claudia Chiavazza", "chiclaudia", { focus: [0.41, 0.88], zoom: 2.5 }),
      photo("h04c2IAyXp8", 6000, 4000, "White flowers in a field by a lake", "Seb Zurcher", "seb_zr", { focus: [0.25, 0.8], zoom: 1.6 }),
      photo("d_v5DiZHfig", 6240, 4160, "A man looking out over the water", "Mathias Reding", "matreding", { focus: [0.48, 0.55], zoom: 1.3 }),
    ],
  },
  {
    id: "lights",
    title: "Lights",
    blurb: "Northern lights, lighthouses and a city after dark.",
    photos: [
      photo("DmA484UHAzw", 4748, 2635, "Green northern lights over a lake", "Jon Anders Dalan", "jonandersdalan"),
      photo("6BRuv2Wqwhc", 4000, 6000, "Red and white lighthouse by a green wall", "Raoul du Plessis", "raouldp", { focus: [0.47, 0.3], zoom: 1.5 }),
      photo("r42PtGYCF7U", 6000, 4000, "A car in the snow under the northern lights", "Jonatan Pie", "r3dmax", { focus: [0.5, 0.83], zoom: 2.2 }),
      photo("ZWwoQRR-zWQ", 3952, 5928, "Lighthouse above grassy sand dunes", "Fynn Zentner", "fyze", { focus: [0.48, 0.58], zoom: 2.5 }),
      photo("AaceTp_LRAM", 3000, 5000, "A city from above at night", "dominik hofbauer", "dominikhofbauer"),
      photo("E06AY-OUD7g", 3850, 5900, "A motorcycle and a distant lighthouse", "Sanjeev Nagaraj", "_sanjeev_ngrj_", { focus: [0.5, 0.78], zoom: 1.3 }),
    ],
  },
  {
    id: "flowers",
    title: "Flowers",
    blurb: "Three of them, up close.",
    photos: [
      photo("yg24LApTKP4", 5178, 7752, "White daffodils with orange centres", "Theo Laflamme", "theolaflamme", { focus: [0.48, 0.5], zoom: 1.4 }),
      photo("WhCX_LVcCqg", 3072, 4608, "Yellow and orange heliopsis flowers", "Kristiina Klaas", "psilocybe53"),
      photo("zNXmmVyKEAg", 4480, 6720, "White flower petals", "Michael & Diane Weidner", "michaelbweidner", { focus: [0.5, 0.48], zoom: 1.3 }),
    ],
  },
  {
    id: "out-and-about",
    title: "Out and about",
    blurb: "Streets, people, deer, and one very good chair.",
    photos: [
      photo("dmf546pckjQ", 4000, 6000, "People crossing the street with umbrellas", "Wenhao Ruan", "wenhao_ruan", { focus: [0.55, 0.3], zoom: 1.5 }),
      photo("B4H-44aAzqc", 2081, 3123, "A pigeon on wet pavement", "Bruno da Costa", "ericpetrozza", { focus: [0.37, 0.5], zoom: 2 }),
      photo("2echtVPwylU", 4000, 6000, "Feeding a spotted deer on the steps", "Wenhao Ruan", "wenhao_ruan", { focus: [0.6, 0.4], zoom: 1.4 }),
      photo("wIZpOCdTb8I", 3538, 5304, "Baked Club sign", "lf.Franciz !!!", "lffranciz", { focus: [0.4, 0.45], zoom: 1.2 }),
      photo("cA6DjKN2vaw", 3034, 4040, "Someone with red hair eating an apple", "Clara Dickieson", "chaosgingerdesigns", { focus: [0.42, 0.38], zoom: 1.5 }),
      photo("FyVM48yP-S4", 4000, 6000, "Someone in a blazer on their phone", "Mike Cox", "iprefermike", { focus: [0.55, 0.25], zoom: 1.8 }),
      photo("4sVimJidmpQ", 4671, 7006, "Fallow deer in a forest", "Evgeniy Bezkorovayniy", "korovay", { focus: [0.5, 0.3], zoom: 1.6 }),
      photo("nV1HMjvlOj4", 6862, 4538, "A modern building in the forest", "Caroline Badran", "___atmos", { focus: [0.67, 0.5], zoom: 1.4 }),
      photo("41lvjsoCJKA", 2267, 3400, "A leather lounge chair and side table", "Clay Banks", "claybanks", { focus: [0.35, 0.5], zoom: 1.2 }),
    ],
  },
]
