import { describe, expect, it } from 'vitest';
import { WIZARD_STEPS, FIRST_WIZARD_STEP, LAST_WIZARD_STEP, isValidWizardStep, clampWizardStep } from './steps';

describe('WIZARD_STEPS', () => {
  it('tem os 8 passos da spec-010, em ordem, ids 0-7', () => {
    expect(WIZARD_STEPS).toHaveLength(8);
    WIZARD_STEPS.forEach((step, i) => expect(step.id).toBe(i));
  });

  it('FIRST/LAST batem com os extremos do array', () => {
    expect(FIRST_WIZARD_STEP).toBe(0);
    expect(LAST_WIZARD_STEP).toBe(7);
  });
});

describe('isValidWizardStep', () => {
  it('aceita 0-7', () => {
    for (let i = 0; i <= 7; i++) expect(isValidWizardStep(i)).toBe(true);
  });

  it('rejeita fora do range, negativo, e não-inteiro', () => {
    expect(isValidWizardStep(-1)).toBe(false);
    expect(isValidWizardStep(8)).toBe(false);
    expect(isValidWizardStep(1.5)).toBe(false);
  });
});

describe('clampWizardStep', () => {
  it('mantém valores dentro do range', () => {
    expect(clampWizardStep(3)).toBe(3);
  });

  it('limita valores fora do range aos extremos', () => {
    expect(clampWizardStep(-5)).toBe(0);
    expect(clampWizardStep(99)).toBe(7);
  });

  it('trunca decimais e trata NaN/Infinity como o primeiro passo', () => {
    expect(clampWizardStep(2.9)).toBe(2);
    expect(clampWizardStep(NaN)).toBe(0);
    expect(clampWizardStep(Infinity)).toBe(7);
    expect(clampWizardStep(-Infinity)).toBe(0);
  });
});
