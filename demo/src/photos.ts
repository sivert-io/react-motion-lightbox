import type { LightboxItem } from 'react-motion-lightbox'

/** A photo on this page: what the lightbox needs, plus the square thumbnail and the credit. */
export interface Photo extends LightboxItem {
  thumb: string
  photographer: string
  profile: string
}

// Each photo comes in three widths and a 480px square. The lightbox gets all
// three widths as a srcset, so a phone downloads the small one and a 4K
// screen the big one.
const photo = (id: string, width: number, height: number, alt: string, photographer: string, username: string): Photo => ({
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
      photo("p2D3wsu5pQM", 5200, 3464, "A river running through a valley between mountains", "admiratio", "admiratio"),
      photo("25Bu6uO9xLw", 6000, 4000, "Nusfjord, a fishing village in Lofoten", "Danny Rienecker", "danny_rienecker"),
      photo("ILYVeUgPkmI", 4928, 3264, "Trolltunga", "Dong Zhang", "perfumekiller"),
      photo("ut7XZMquCoU", 6038, 4025, "Houses by the water in Lofoten", "Benoît Deschasaux", "benowa"),
      photo("cKBsq-5U17A", 3358, 2239, "Man standing on a cliff over a river", "Robert Bye", "robertbye"),
      photo("QMtI1dZ6KJM", 6192, 4128, "A mountain lake reflecting the peaks", "Roger Benz", "robe76"),
      photo("N9vsB6OEeKM", 6000, 4000, "Trees beside a lake", "Claudia Chiavazza", "chiclaudia"),
      photo("h04c2IAyXp8", 6000, 4000, "White flowers in a field by a lake", "Seb Zurcher", "seb_zr"),
      photo("d_v5DiZHfig", 6240, 4160, "A man looking out over the water", "Mathias Reding", "matreding"),
    ],
  },
  {
    id: "lights",
    title: "Lights",
    blurb: "Northern lights, lighthouses and a city after dark.",
    photos: [
      photo("DmA484UHAzw", 4748, 2635, "Green northern lights over a lake", "Jon Anders Dalan", "jonandersdalan"),
      photo("6BRuv2Wqwhc", 4000, 6000, "Red and white lighthouse by a green wall", "Raoul du Plessis", "raouldp"),
      photo("r42PtGYCF7U", 6000, 4000, "A car in the snow under the northern lights", "Jonatan Pie", "r3dmax"),
      photo("ZWwoQRR-zWQ", 3952, 5928, "Lighthouse above grassy sand dunes", "Fynn Zentner", "fyze"),
      photo("AaceTp_LRAM", 3000, 5000, "A city from above at night", "dominik hofbauer", "dominikhofbauer"),
      photo("E06AY-OUD7g", 3850, 5900, "A motorcycle and a distant lighthouse", "Sanjeev Nagaraj", "_sanjeev_ngrj_"),
    ],
  },
  {
    id: "flowers",
    title: "Flowers",
    blurb: "Three of them, up close.",
    photos: [
      photo("yg24LApTKP4", 5178, 7752, "White daffodils with orange centres", "Theo Laflamme", "theolaflamme"),
      photo("WhCX_LVcCqg", 3072, 4608, "Yellow and orange heliopsis flowers", "Kristiina Klaas", "psilocybe53"),
      photo("zNXmmVyKEAg", 4480, 6720, "White flower petals", "Michael & Diane Weidner", "michaelbweidner"),
    ],
  },
  {
    id: "out-and-about",
    title: "Out and about",
    blurb: "Streets, people, deer, and one very good chair.",
    photos: [
      photo("dmf546pckjQ", 4000, 6000, "People crossing the street with umbrellas", "Wenhao Ruan", "wenhao_ruan"),
      photo("B4H-44aAzqc", 2081, 3123, "A pigeon on wet pavement", "Bruno da Costa", "ericpetrozza"),
      photo("2echtVPwylU", 4000, 6000, "Feeding a spotted deer on the steps", "Wenhao Ruan", "wenhao_ruan"),
      photo("wIZpOCdTb8I", 3538, 5304, "Baked Club sign", "lf.Franciz !!!", "lffranciz"),
      photo("cA6DjKN2vaw", 3034, 4040, "Someone with red hair eating an apple", "Clara Dickieson", "chaosgingerdesigns"),
      photo("FyVM48yP-S4", 4000, 6000, "Someone in a blazer on their phone", "Mike Cox", "iprefermike"),
      photo("4sVimJidmpQ", 4671, 7006, "Fallow deer in a forest", "Evgeniy Bezkorovayniy", "korovay"),
      photo("nV1HMjvlOj4", 6862, 4538, "A modern building in the forest", "Caroline Badran", "___atmos"),
      photo("41lvjsoCJKA", 2267, 3400, "A leather lounge chair and side table", "Clay Banks", "claybanks"),
    ],
  },
]
