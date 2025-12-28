export const PALETTES = {
  // Vibrant pastels - great for balls
  candy: [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181, 0xaa96da],

  // Neon pop
  neon: [0xff00ff, 0x00ffff, 0xffff00, 0xff6600, 0x00ff66, 0x6600ff],

  // Soft muted
  muted: [0xe8d5b7, 0xb8e0d2, 0xd6eadf, 0xeac4d5, 0x95b8d1, 0xdfd3c3],

  // Sunset
  sunset: [0xff595e, 0xff924c, 0xffca3a, 0xc77dff, 0x8ac926, 0x1982c4],
};

export function randomFromPalette(palette: number[]): number {
  return palette[Math.floor(Math.random() * palette.length)];
}
