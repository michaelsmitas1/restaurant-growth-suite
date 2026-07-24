import { create } from 'zustand';
import { clampWizardStep, FIRST_WIZARD_STEP } from './steps';

interface WizardState {
  step: number;
  restaurantId: string | null;
  setStep: (step: number) => void;
  hydrate: (data: { step: number; restaurantId: string | null }) => void;
}

// Estado de navegação do wizard (passo atual + id do restaurante em edição).
// Os dados de cada passo (nome, cor, design do card etc.) vivem no estado
// próprio de cada componente de passo — persistidos via Server Action no
// "Continuar", não aqui. Ver <CardPreview> (Sessão 4) para o motivo: o
// preview ao vivo só precisa dos campos do passo atual, não de todos.
export const useWizardStore = create<WizardState>((set) => ({
  step: FIRST_WIZARD_STEP,
  restaurantId: null,
  setStep: (step) => set({ step: clampWizardStep(step) }),
  hydrate: (data) => set({ step: clampWizardStep(data.step), restaurantId: data.restaurantId }),
}));
