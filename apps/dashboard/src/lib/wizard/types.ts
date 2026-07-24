// Props comuns a todo componente de passo (Step1, Step1b, Step2, ...).
// Cada passo valida e salva seus próprios dados (Server Action própria) e
// chama onSaved quando terminar — o <Wizard> shell só sabe navegar, não
// sabe nada sobre o conteúdo de nenhum passo específico.
export interface WizardStepProps {
  restaurantId: string | null;
  onSaved: (restaurantId: string, nextStep: number) => void;
}
