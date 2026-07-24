import { WIZARD_STEPS } from '@/lib/wizard/steps';

// Passos ainda não implementados (Sessões 8+, fora do escopo desta rodada).
export default function WizardStepPlaceholder({ step }: { step: number }) {
  return (
    <div className="rounded-lg bg-surface p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-text-primary">{WIZARD_STEPS[step]?.title}</p>
      <p className="mt-2 text-sm text-text-muted">Este passo ainda está em construção.</p>
    </div>
  );
}
