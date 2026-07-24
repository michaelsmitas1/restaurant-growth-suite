'use client';

import { useEffect, type ComponentType } from 'react';
import { useWizardStore } from '@/lib/wizard/store';
import type { WizardStepProps } from '@/lib/wizard/types';
import { Button } from '@/components/ui/Button';
import WizardProgress from './WizardProgress';
import WizardStepPlaceholder from './WizardStepPlaceholder';
import Step1 from './Step1';
import Step1b from './Step1b';

// Registro de componentes por passo — Sessão 7 substitui o próximo `null`
// pelo componente real (Passo 2). Passos 3-7 ficam como placeholder até as
// Sessões 8+ (fora do escopo desta rodada, ver
// specs/010-onboarding-wizard.md). Cada passo real controla sua própria
// validação/submit — só ele sabe quando está pronto para avançar (ver
// WizardStepProps em lib/wizard/types.ts).
const STEP_COMPONENTS: Array<ComponentType<WizardStepProps> | null> = [
  Step1, Step1b, null, null, null, null, null, null,
];

interface Props {
  initialStep: number;
  initialRestaurantId: string | null;
}

export default function Wizard({ initialStep, initialRestaurantId }: Props) {
  const { step, restaurantId, hydrate, setStep, setRestaurantId } = useWizardStore();

  useEffect(() => {
    hydrate({ step: initialStep, restaurantId: initialRestaurantId });
    // Hidrata só uma vez, a partir dos dados carregados no servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  function handleSaved(newRestaurantId: string, nextStep: number) {
    setRestaurantId(newRestaurantId);
    setStep(nextStep);
  }

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <WizardProgress currentStep={step} />

      <main className="flex flex-1 justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg">
          {StepComponent ? (
            <StepComponent restaurantId={restaurantId} onSaved={handleSaved} />
          ) : (
            <WizardStepPlaceholder step={step} />
          )}
        </div>
      </main>

      {step > 0 && (
        <footer className="sticky bottom-0 border-t border-border bg-surface px-4 py-3">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
            <Button variant="secondary" onClick={handleBack}>
              Voltar
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
