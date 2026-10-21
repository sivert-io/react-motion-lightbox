import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// The demo site's three faces, from public/fonts.
export const fontsLoaded = Promise.all([
  loadFont({ family: "Young Serif", url: staticFile("fonts/young-serif.woff2") }),
  loadFont({ family: "Figtree", url: staticFile("fonts/figtree.woff2"), weight: "400 600" }),
  loadFont({ family: "JetBrains Mono", url: staticFile("fonts/jetbrains-mono.woff2") }),
]);

export const SERIF = "'Young Serif', serif";
export const SANS = "Figtree, sans-serif";
export const MONO = "'JetBrains Mono', monospace";
