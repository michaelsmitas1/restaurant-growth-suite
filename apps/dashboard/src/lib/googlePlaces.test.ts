import { describe, expect, it } from 'vitest';
import { parseGoogleBusinessLink, buildGoogleReviewLink } from './googlePlaces';

describe('parseGoogleBusinessLink', () => {
  it('extrai place_id direto de um link de review', () => {
    const result = parseGoogleBusinessLink('https://search.google.com/local/writereview?placeid=ChIJXXX123');
    expect(result).toEqual({ placeId: 'ChIJXXX123', searchQuery: null });
  });

  it('extrai o nome do restaurante de um link /place/... do Maps', () => {
    const result = parseGoogleBusinessLink('https://www.google.com/maps/place/Sorveteria+da+V%C3%B3+Maria/@-23.5,-46.6,17z');
    expect(result).toEqual({ placeId: null, searchQuery: 'Sorveteria da Vó Maria' });
  });

  it('trata texto puro (não-URL) como query de busca', () => {
    const result = parseGoogleBusinessLink('Sorveteria da Vó Maria');
    expect(result).toEqual({ placeId: null, searchQuery: 'Sorveteria da Vó Maria' });
  });

  it('retorna tudo null para uma URL reconhecida sem place_id nem /place/', () => {
    const result = parseGoogleBusinessLink('https://maps.google.com/?cid=12345');
    expect(result).toEqual({ placeId: null, searchQuery: null });
  });

  it('string vazia retorna tudo null', () => {
    expect(parseGoogleBusinessLink('')).toEqual({ placeId: null, searchQuery: null });
    expect(parseGoogleBusinessLink('   ')).toEqual({ placeId: null, searchQuery: null });
  });
});

describe('buildGoogleReviewLink', () => {
  it('monta o link de review a partir do place_id', () => {
    expect(buildGoogleReviewLink('ChIJXXX123')).toBe('https://search.google.com/local/writereview?placeid=ChIJXXX123');
  });

  it('faz URL-encode do place_id', () => {
    expect(buildGoogleReviewLink('a b/c')).toBe('https://search.google.com/local/writereview?placeid=a%20b%2Fc');
  });
});
