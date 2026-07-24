'use client';

import { notFound } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { ConsentScreen } from '@/components/ui/ConsentScreen';
import CardPreview from '@/components/CardPreview';

/**
 * Página de referência dos componentes base — dev-only.
 * Não deployada em produção (ver guarda abaixo).
 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const [toggleOn, setToggleOn] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [cardFilled, setCardFilled] = useState(false);

  if (showConsent) {
    return (
      <ConsentScreen
        restaurantName="Sorveteria da Vó Maria"
        consentVersion="v1"
        onAccept={() => setShowConsent(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper p-10 space-y-12 font-sans text-text-primary">
      <h1 className="font-display text-3xl font-bold">Remy — Componentes base</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="celebration">Celebration</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Input</h2>
        <div className="max-w-sm space-y-3">
          <Input placeholder="Nome do restaurante" />
          <Input placeholder="Com erro" error="Campo obrigatório" />
          <Input placeholder="Desabilitado" disabled />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Select</h2>
        <div className="max-w-sm">
          <Select defaultValue="restaurante">
            <option value="bar">Bar</option>
            <option value="restaurante">Restaurante</option>
            <option value="cafeteria">Cafeteria</option>
            <option value="lanchonete">Lanchonete</option>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Card</h2>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <Card variant="default">Default</Card>
          <Card variant="elevated">Elevated</Card>
          <Card variant="celebration">Celebration</Card>
          <Card variant="wallet">Wallet</Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Badge</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="celebration">VIP</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Toggle</h2>
        <Toggle checked={toggleOn} onChange={setToggleOn} label="Ativar automação" />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tela de consentimento</h2>
        <Button variant="secondary" onClick={() => setShowConsent(true)}>
          Ver tela de aceite
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">CardPreview (spec-010, Passo 1b — reusado pela Web Wallet)</h2>
        <div className="flex flex-wrap items-start gap-3">
          <Button variant="secondary" onClick={() => setCardFilled(v => !v)}>
            {cardFilled ? 'Ver vazio' : 'Ver exemplo (3/5)'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-8">
          <CardPreview
            programName="Clube do Farrapos"
            backgroundColor="#12224F"
            stampLabel="visitas até o prêmio"
            stampIcon={{ type: 'preset', preset: 'plate' }}
            totalStamps={5}
            currentStamps={cardFilled ? 3 : 0}
          />
          <CardPreview
            programName="Clube VIP"
            backgroundColor="#E1C463"
            textColor="#12224F"
            stampLabel="visitas até o prêmio"
            stampIcon={{ type: 'preset', preset: 'mug' }}
            totalStamps={5}
            currentStamps={5}
            isVip
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold font-data">Tipografia de dados</h2>
        <p className="font-data text-2xl">R$ 1.234,56 · 3/5 selos</p>
      </section>
    </div>
  );
}
