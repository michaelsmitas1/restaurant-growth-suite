import { WIZARD_STEPS } from '@/lib/wizard/steps';

export default function WizardProgress({ currentStep }: { currentStep: number }) {
  const pct = Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100);

  return (
    <div className="border-b border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-lg items-center justify-between text-xs font-medium text-text-secondary">
        <span>Passo {currentStep + 1} de {WIZARD_STEPS.length}</span>
        <span>{WIZARD_STEPS[currentStep]?.title}</span>
      </div>
      <div className="mx-auto mt-2 h-1.5 max-w-lg overflow-hidden rounded-full bg-surface-selected">
        <div
          className="h-full rounded-full bg-royal-blue transition-all duration-normal ease-standard"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
