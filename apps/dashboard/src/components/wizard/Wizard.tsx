'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useWizardStore } from '@/lib/wizard/store';
import { LAST_WIZARD_STEP } from '@/lib/wizard/steps';
import { advanceWizardStep } from '@/lib/wizard/actions';
import { Button } from '@/components/ui/Button';
import WizardProgress from './WizardProgress';
import WizardStepPlaceholder from './WizardStepPlaceholder';

// Registro de componentes por passo — Sessões 5/6/7 substituem os `null`
// pelos componentes reais (Passo 1, 1b, 2). Passos 3-7 ficam como
// placeholder até as Sessões 8+ (fora do escopo desta rodada, ver
// specs/010-onboarding-wizard.md).
const STEP_COMPONENTS: Array<ComponentType | null> = [null, null, null, null, null, null, null, null];

interface Props {
  initialStep: number;
  initialRestaurantId: string | null;
}

export default function Wizard({ initialStep, initialRestaurantId }: Props) {
  const { step, restaurantId, hydrate, setStep } = useWizardStore();
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate({ step: initialStep, restaurantId: initialRestaurantId });
    // Hidrata só uma vez, a partir dos dados carregados no servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  async function handleContinue() {
    // Sem restaurantId ainda: o Passo 1 (Sessão 5) é quem cria o
    // restaurante ao salvar — até lá não há o que persistir aqui.
    if (!restaurantId) return;
    setError(null);
    setAdvancing(true);
    try {
      const next = Math.min(step + 1, LAST_WIZARD_STEP);
      await advanceWizardStep({ restaurantId, step: next });
      setStep(next);
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setAdvancing(false);
    }
  }

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <WizardProgress currentStep={step} />

      <main className="flex flex-1 justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg">
          {StepComponent ? <StepComponent /> : <WizardStepPlaceholder step={step} />}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-surface px-4 py-3">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <Button variant="secondary" onClick={handleBack} disabled={step === 0 || advancing}>
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            {error && <span className="text-xs text-error">{error}</span>}
            <Button variant="primary" onClick={handleContinue} disabled={!restaurantId || advancing}>
              {advancing ? 'Salvando…' : 'Continuar'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
