'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import CardPreview from '@/components/CardPreview';
import { createClient } from '@/lib/supabase/client';
import { slugify, isValidSlug } from '@/lib/slug';
import { saveStep1 } from '@/lib/wizard/step1';
import type { WizardStepProps } from '@/lib/wizard/types';

type Segment = 'restaurante' | 'bar' | 'cafeteria' | 'lanchonete' | 'outro';

const SEGMENTS: Array<{ value: Segment; label: string }> = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'bar', label: 'Bar' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'lanchonete', label: 'Lanchonete' },
  { value: 'outro', label: 'Outro' },
];

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function Step1({ restaurantId, onSaved }: WizardStepProps) {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState<Segment>('restaurante');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1B3EA4');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Retomando um restaurante já iniciado: carrega os dados salvos.
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('name, segment, address, primary_color, slug, logo_url')
        .eq('id', restaurantId)
        .maybeSingle();
      if (cancelled || !data) return;
      setName(data.name ?? '');
      setSegment((data.segment as Segment) ?? 'restaurante');
      setAddress(data.address ?? '');
      setPrimaryColor(data.primary_color ?? '#1B3EA4');
      setSlug(data.slug ?? '');
      setSlugTouched(true);
      setLogoUrl(data.logo_url ?? null);
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  // Sugere o slug a partir do nome (debounce 500ms) — só enquanto o dono
  // não editou o slug manualmente.
  useEffect(() => {
    if (slugTouched) return;
    const timer = setTimeout(() => setSlug(slugify(name)), 500);
    return () => clearTimeout(timer);
  }, [name, slugTouched]);

  // Checa disponibilidade em tempo real (debounce 500ms).
  useEffect(() => {
    if (!slug) { setSlugStatus('idle'); return; }
    if (!isValidSlug(slug)) { setSlugStatus('invalid'); return; }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug });
        if (restaurantId) params.set('excludeId', restaurantId);
        const res = await fetch(`/api/check-slug?${params.toString()}`);
        const json = await res.json();
        setSlugStatus(json.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, restaurantId]);

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLogoError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLogoError('Envie um arquivo JPG ou PNG.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Arquivo muito grande — máximo 2MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('no-session');

      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('restaurant-logos').upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: pub } = supabase.storage.from('restaurant-logos').getPublicUrl(path);
      setLogoUrl(pub.publicUrl);
    } catch {
      setLogoError('Não foi possível enviar a logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  }

  const nameValid = name.trim().length >= 2;
  const addressValid = address.trim().length >= 5;
  const canSubmit = nameValid && addressValid && slugStatus === 'available' && !submitting && !uploadingLogo;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await saveStep1({
        restaurantId,
        name: name.trim(),
        segment,
        address: address.trim(),
        primaryColor,
        slug,
        logoUrl,
      });
      onSaved(result.restaurantId, 1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary">Seu restaurante</h1>
        <p className="mt-1 text-sm text-text-secondary">Vamos começar pelo básico.</p>
      </div>

      <div className="space-y-4 rounded-lg bg-surface p-5 shadow-sm">
        <div>
          <label htmlFor="step1-name" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Nome do restaurante
          </label>
          <Input id="step1-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sorveteria da Vó Maria" />
        </div>

        <div>
          <label htmlFor="step1-segment" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Categoria
          </label>
          <Select id="step1-segment" value={segment} onChange={e => setSegment(e.target.value as Segment)}>
            {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>

        <div>
          <label htmlFor="step1-address" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Endereço completo
          </label>
          <Input id="step1-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
        </div>

        <div>
          <label htmlFor="step1-color" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Cor principal
          </label>
          <div className="flex items-center gap-3">
            <input
              id="step1-color"
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-sm border border-border bg-surface"
            />
            <span className="font-data text-sm text-text-secondary">{primaryColor}</span>
          </div>
        </div>

        <div>
          <label htmlFor="step1-logo" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Logo (opcional, JPG ou PNG até 2MB)
          </label>
          <input
            id="step1-logo"
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-royal-blue-subtle file:px-3 file:py-2 file:text-xs file:font-semibold file:text-royal-blue"
          />
          {uploadingLogo && <p className="mt-1 text-xs text-text-muted">Enviando…</p>}
          {logoError && <p className="mt-1 text-xs text-error">{logoError}</p>}
        </div>

        <div>
          <label htmlFor="step1-slug" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Link do seu programa
          </label>
          <div className="flex items-center gap-1 rounded-sm border border-border bg-surface px-4 py-3 text-sm text-text-primary focus-within:border-border-focus focus-within:ring-[3px] focus-within:ring-royal-blue-subtle">
            <span className="text-text-muted">remy.app.br/</span>
            <input
              id="step1-slug"
              value={slug}
              onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
          <SlugStatusLabel status={slugStatus} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-text-secondary">Preview do card do cliente</p>
        <CardPreview
          programName={name || 'Seu programa'}
          backgroundColor={primaryColor}
          stampLabel="visitas até o prêmio"
          stampIcon={{ type: 'preset', preset: 'plate' }}
          logoUrl={logoUrl}
          totalStamps={5}
          currentStamps={0}
        />
      </div>

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <Button variant="primary" size="full" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? 'Salvando…' : 'Continuar'}
      </Button>
    </div>
  );
}

function SlugStatusLabel({ status }: { status: SlugStatus }) {
  if (status === 'checking') return <p className="mt-1 text-xs text-text-muted">Verificando disponibilidade…</p>;
  if (status === 'available') return <p className="mt-1 text-xs text-success">Disponível</p>;
  if (status === 'taken') return <p className="mt-1 text-xs text-error">Esse link já está em uso</p>;
  if (status === 'invalid') return <p className="mt-1 text-xs text-error">Use pelo menos 3 letras minúsculas, números e hífen</p>;
  return null;
}
