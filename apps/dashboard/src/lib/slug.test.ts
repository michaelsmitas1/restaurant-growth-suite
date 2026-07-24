import { describe, expect, it } from 'vitest';
import { slugify, isValidSlug } from './slug';

describe('slugify', () => {
  it('remove acentos e coloca em minúsculas', () => {
    expect(slugify('Café da Ana')).toBe('cafe-da-ana');
    expect(slugify('Sorveteria da Vó Maria')).toBe('sorveteria-da-vo-maria');
  });

  it('remove pontuação e caracteres especiais', () => {
    expect(slugify('Farrapos Bar & Grill!!')).toBe('farrapos-bar-grill');
  });

  it('colapsa espaços/underscores/hífens repetidos em um só hífen', () => {
    expect(slugify('a   b__c---d')).toBe('a-b-c-d');
  });

  it('remove hífen nas pontas', () => {
    expect(slugify('  -Nome-  ')).toBe('nome');
  });

  it('trunca em 60 caracteres', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBe(60);
  });

  it('string vazia vira string vazia', () => {
    expect(slugify('')).toBe('');
  });
});

describe('isValidSlug', () => {
  it('aceita letras minúsculas, números e hífen simples entre segmentos', () => {
    expect(isValidSlug('farrapos-bar')).toBe(true);
    expect(isValidSlug('abc')).toBe(true);
    expect(isValidSlug('rest123')).toBe(true);
  });

  it('rejeita curto demais (< 3), maiúsculas, espaços, hífen duplo/nas pontas', () => {
    expect(isValidSlug('ab')).toBe(false);
    expect(isValidSlug('Farrapos')).toBe(false);
    expect(isValidSlug('farrapos bar')).toBe(false);
    expect(isValidSlug('farrapos--bar')).toBe(false);
    expect(isValidSlug('-farrapos')).toBe(false);
    expect(isValidSlug('farrapos-')).toBe(false);
  });

  it('rejeita mais de 60 caracteres', () => {
    expect(isValidSlug('a'.repeat(61))).toBe(false);
  });
});
