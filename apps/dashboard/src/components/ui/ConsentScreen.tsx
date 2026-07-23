'use client';

import { useState } from 'react';
import { Button } from './Button';

export interface ConsentScreenProps {
  restaurantName: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  consentVersion: string;
  onAccept: (consentVersion: string) => void;
}

/**
 * Tela de aceite (LGPD) — CLAUDE.md "Fluxo de consentimento".
 * Acontece imediatamente após a verificação OTP e antes de qualquer
 * campo pessoal. Reutilizada pela spec-023 (cadastro do cliente).
 */
export function ConsentScreen({
  restaurantName,
  privacyPolicyUrl = '#',
  termsUrl = '#',
  consentVersion,
  onAccept,
}: ConsentScreenProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex min-h-dvh w-full max-w-[390px] mx-auto flex-col justify-between bg-paper px-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-6">
          Antes de continuar
        </h1>

        <p className="text-base text-text-secondary leading-relaxed mb-4">
          {restaurantName} usa o Remy para gerenciar seu programa de
          fidelidade. Isso significa que:
        </p>

        <ul className="space-y-3 text-base text-text-secondary leading-relaxed mb-6 list-disc pl-5">
          <li>
            Seus dados (nome, telefone e o que mais você compartilhar) ficam
            com {restaurantName} e com o Remy, que faz o programa funcionar.
          </li>
          <li>Você recebe mensagens do restaurante pelo WhatsApp (novidades do seu progresso, nunca spam).</li>
          <li>Você pode sair quando quiser — apagamos seus dados a pedido.</li>
        </ul>

        <div className="flex gap-4 text-sm mb-6">
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-royal-blue underline"
          >
            Política de Privacidade
          </a>
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-royal-blue underline"
          >
            Termos de Uso
          </a>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-5 w-5 flex-shrink-0 rounded-xs border border-border-strong text-royal-blue focus:outline-none focus:ring-[3px] focus:ring-royal-blue-subtle cursor-pointer"
          />
          <span className="text-base text-text-primary">
            Li e aceito para continuar
          </span>
        </label>
      </div>

      <Button
        variant="primary"
        size="full"
        disabled={!accepted}
        onClick={() => onAccept(consentVersion)}
        className="mt-8"
      >
        Continuar
      </Button>
    </div>
  );
}
