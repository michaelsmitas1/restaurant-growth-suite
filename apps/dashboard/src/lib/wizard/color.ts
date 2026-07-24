// Sugestão automática de cor de fundo do card a partir da logo (Passo 1b).
// A leitura de pixels em si (canvas/Image, DOM-only) fica no componente —
// aqui só a matemática pura, testável sem jsdom/canvas.
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Média simples dos pixels não-transparentes de um ImageData.data (RGBA).
export function averageColorFromPixels(pixels: ArrayLike<number>): string {
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue; // ignora pixels totalmente transparentes
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    count++;
  }
  if (count === 0) return '#12224F';
  return rgbToHex(r / count, g / count, b / count);
}
