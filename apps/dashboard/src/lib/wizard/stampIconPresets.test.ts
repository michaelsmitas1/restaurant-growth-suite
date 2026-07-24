import { describe, expect, it } from 'vitest';
import { STAMP_ICON_PRESETS, STAMP_ICON_SEGMENTS, findStampIconPreset, presetsForSegment } from './stampIconPresets';

describe('STAMP_ICON_PRESETS', () => {
  it('tem pelo menos um preset por segmento, com ids únicos', () => {
    const ids = new Set<string>();
    for (const segment of STAMP_ICON_SEGMENTS) {
      const presets = STAMP_ICON_PRESETS[segment];
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach(p => {
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
      });
    }
  });
});

describe('findStampIconPreset', () => {
  it('acha um preset existente pelo id', () => {
    expect(findStampIconPreset('pizza').label).toBe('Pizza');
  });

  it('cai no default (prato) para id desconhecido, null ou undefined', () => {
    expect(findStampIconPreset('nao-existe').id).toBe('plate');
    expect(findStampIconPreset(null).id).toBe('plate');
    expect(findStampIconPreset(undefined).id).toBe('plate');
  });
});

describe('presetsForSegment', () => {
  it('retorna o conjunto certo para um segmento conhecido', () => {
    expect(presetsForSegment('cafeteria')).toBe(STAMP_ICON_PRESETS.cafeteria);
  });

  it('é case-insensitive', () => {
    expect(presetsForSegment('Bar')).toBe(STAMP_ICON_PRESETS.bar);
  });

  it('cai em "restaurante" para segmento desconhecido, null ou undefined', () => {
    expect(presetsForSegment('sorveteria')).toBe(STAMP_ICON_PRESETS.restaurante);
    expect(presetsForSegment(null)).toBe(STAMP_ICON_PRESETS.restaurante);
    expect(presetsForSegment(undefined)).toBe(STAMP_ICON_PRESETS.restaurante);
  });
});
