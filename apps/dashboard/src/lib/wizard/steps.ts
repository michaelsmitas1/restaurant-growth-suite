// Ordem e títulos dos 8 passos do wizard (spec-010). Índice = restaurants.wizard_step (0-7).
export interface WizardStepMeta {
  id: number;
  title: string;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 0, title: 'Restaurante' },
  { id: 1, title: 'Design do card' },
  { id: 2, title: 'Google e redes' },
  { id: 3, title: 'Cadastro' },
  { id: 4, title: 'Programa' },
  { id: 5, title: 'Validação' },
  { id: 6, title: 'WhatsApp' },
  { id: 7, title: 'Ativar' },
];

export const FIRST_WIZARD_STEP = 0;
export const LAST_WIZARD_STEP = WIZARD_STEPS.length - 1;

export function isValidWizardStep(step: number): boolean {
  return Number.isInteger(step) && step >= FIRST_WIZARD_STEP && step <= LAST_WIZARD_STEP;
}

// Restringe um passo candidato ao intervalo válido — usado ao hidratar o
// estado do wizard a partir de restaurants.wizard_step (nunca confiar que o
// valor salvo está dentro do range, mesmo sendo gravado só por esta mesma app).
export function clampWizardStep(step: number): number {
  if (Number.isNaN(step)) return FIRST_WIZARD_STEP;
  return Math.min(LAST_WIZARD_STEP, Math.max(FIRST_WIZARD_STEP, Math.trunc(step)));
}
