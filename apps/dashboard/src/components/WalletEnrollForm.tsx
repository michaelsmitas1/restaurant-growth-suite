'use client';
import { useState, useTransition } from 'react';
import { enrollInWallet } from '@/app/actions/wallet';

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function WalletEnrollForm({ slug }: { slug: string }) {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await enrollInWallet(slug, phone, consent);
        window.location.href = result.saveUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <input
        type="tel"
        inputMode="tel"
        required
        placeholder="(11) 99999-9999"
        value={phone}
        onChange={(e) => setPhone(maskPhone(e.target.value))}
        style={{
          padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb',
          fontSize: 16, outline: 'none', width: '100%',
        }}
      />
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#666', textAlign: 'left', lineHeight: 1.4 }}>
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        Aceito receber mensagens sobre meu programa de fidelidade neste WhatsApp.
      </label>
      {error && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={pending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '15px', borderRadius: 12, border: 'none', background: '#4285f4',
          color: '#fff', fontWeight: 700, fontSize: 15, cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Salvando…' : 'Salvar no Google Wallet'}
      </button>
    </form>
  );
}
