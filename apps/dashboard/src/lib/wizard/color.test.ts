import { describe, expect, it } from 'vitest';
import { rgbToHex, averageColorFromPixels } from './color';

describe('rgbToHex', () => {
  it('converte RGB para hex maiúsculo', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    expect(rgbToHex(27, 62, 164)).toBe('#1B3EA4');
  });

  it('arredonda e limita ao range 0-255', () => {
    expect(rgbToHex(-10, 300, 127.6)).toBe('#00FF80');
  });
});

describe('averageColorFromPixels', () => {
  it('calcula a média de pixels sólidos', () => {
    // 2 pixels: preto opaco e branco opaco → média cinza
    const pixels = [0, 0, 0, 255, 255, 255, 255, 255];
    expect(averageColorFromPixels(pixels)).toBe('#808080');
  });

  it('ignora pixels totalmente transparentes (alpha 0)', () => {
    const pixels = [
      10, 20, 30, 255, // opaco
      255, 255, 255, 0, // transparente, deve ser ignorado
    ];
    expect(averageColorFromPixels(pixels)).toBe('#0A141E');
  });

  it('retorna um azul-marinho default quando todos os pixels são transparentes', () => {
    const pixels = [255, 255, 255, 0, 0, 0, 0, 0];
    expect(averageColorFromPixels(pixels)).toBe('#12224F');
  });
});
