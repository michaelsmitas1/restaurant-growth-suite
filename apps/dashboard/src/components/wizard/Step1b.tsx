'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import CardPreview from '@/components/CardPreview';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';
import { presetsForSegment } from '@/lib/wizard/stampIconPresets';
import { averageColorFromPixels } from '@/lib/wizard/color';
import { saveStep1b } from '@/lib/wizard/step1b';
import type { WizardStepProps } from '@/lib/wizard/types';

const MAX_ICON_BYTES = 200 * 1024;

interface RestaurantContext {
  name: string;
  segment: string | null;
  logoUrl: string | null;
}

export default function Step1b({ restaurantId, onSaved }: WizardStepProps) {
  const [context, setContext] = useState<RestaurantContext | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#12224F');
  const [stampIconType, setStampIconType] = useState<'preset' | 'custom'>('preset');
  const [stampIconPreset, setStampIconPreset] = useState('plate');
  const [stampIconCustomUrl, setStampIconCustomUrl] = useState<string | null>(null);
  const [programName, setProgramName] = useState('');
  const [stampLabel, setStampLabel] = useState('visitas até o prêmio');
  const [barcodeType, setBarcodeType] = useState<'qr' | 'pdf417'>('qr');
  const [previewFilled, setPreviewFilled] = useState(false);
  const [suggestingColor, setSuggestingColor] = useState(false);
  const [iconError, setIconError] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [{ data: restaurant }, { data: card }] = await Promise.all([
        supabase.from('restaurants').select('name, segment, logo_url').eq('id', restaurantId).maybeSingle(),
        supabase.from('card_design_config').select('*').eq('restaurant_id', restaurantId).maybeSingle(),
      ]);
      if (cancelled) return;

      if (restaurant) {
        setContext({ name: restaurant.name, segment: restaurant.segment, logoUrl: restaurant.logo_url });
      }
      if (card) {
        setBackgroundColor(card.background_color ?? '#12224F');
        setStampIconType((card.stamp_icon_type as 'preset' | 'custom') ?? 'preset');
        setStampIconPreset(card.stamp_icon_preset ?? 'plate');
        setStampIconCustomUrl(card.stamp_icon_custom_url ?? null);
        setStampLabel(card.stamp_label ?? 'visitas até o prêmio');
        setBarcodeType(card.barcode_type === 'pdf417' ? 'pdf417' : 'qr');
        setProgramName(card.program_name ?? (restaurant ? `Programa ${restaurant.name}` : ''));
      } else if (restaurant) {
        setProgramName(`Programa ${restaurant.name}`.slice(0, 30));
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  async function handleSuggestColor() {
    if (!context?.logoUrl) return;
    setSuggestingColor(true);
    try {
      const color = await suggestColorFromImage(context.logoUrl);
      setBackgroundColor(color);
    } catch {
      // Sem sorte extraindo a cor (CORS, imagem indisponível etc.) — não
      // bloqueia o passo, o dono continua com o color picker manual.
    } finally {
      setSuggestingColor(false);
    }
  }

  async function handleIconChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !restaurantId) return;

    setIconError(null);
    if (file.type !== 'image/png') {
      setIconError('Envie um arquivo PNG.');
      return;
    }
    if (file.size > MAX_ICON_BYTES) {
      setIconError('Arquivo muito grande — máximo 200KB.');
      return;
    }

    setUploadingIcon(true);
    try {
      const supabase = createClient();
      const path = `${restaurantId}/icon-${Date.now()}.png`;
      const { error } = await supabase.storage.from('stamp-icons').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('stamp-icons').getPublicUrl(path);
      setStampIconCustomUrl(pub.publicUrl);
      setStampIconType('custom');
    } catch {
      setIconError('Não foi possível enviar o ícone. Tente novamente.');
    } finally {
      setUploadingIcon(false);
    }
  }

  const presets = presetsForSegment(context?.segment ?? null);
  const canSubmit =
    !!restaurantId &&
    programName.trim().length > 0 &&
    programName.length <= 30 &&
    stampLabel.trim().length > 0 &&
    (stampIconType === 'preset' ? !!stampIconPreset : !!stampIconCustomUrl) &&
    !submitting &&
    !uploadingIcon;

  async function handleSubmit() {
    if (!canSubmit || !restaurantId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await saveStep1b({
        restaurantId,
        backgroundColor,
        stampIconType,
        stampIconPreset: stampIconType === 'preset' ? stampIconPreset : null,
        stampIconCustomUrl: stampIconType === 'custom' ? stampIconCustomUrl : null,
        programName: programName.trim(),
        stampLabel: stampLabel.trim(),
        barcodeType,
      });
      onSaved(result.restaurantId, 2);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurantId) {
    return <p className="text-sm text-text-muted">Complete o Passo 1 primeiro.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-text-primary">Design do card</h1>
        <p className="mt-1 text-sm text-text-secondary">
          É assim que seus clientes vão ver o cartão de fidelidade no celular.
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-surface p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Cor de fundo</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={e => setBackgroundColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-sm border border-border bg-surface"
              aria-label="Cor de fundo"
            />
            <span className="font-data text-sm text-text-secondary">{backgroundColor}</span>
            {context?.logoUrl && (
              <Button variant="secondary" onClick={handleSuggestColor} disabled={suggestingColor} className="ml-auto">
                {suggestingColor ? 'Analisando…' : 'Sugerir da logo'}
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Ícone do selo</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => {
              const Icon = p.icon;
              const selected = stampIconType === 'preset' && stampIconPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setStampIconType('preset'); setStampIconPreset(p.id); }}
                  aria-pressed={selected}
                  title={p.label}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-sm border',
                    selected ? 'border-royal-blue bg-royal-blue-subtle' : 'border-border bg-surface'
                  )}
                >
                  <Icon size={18} className={selected ? 'text-royal-blue' : 'text-text-secondary'} />
                </button>
              );
            })}
            <label
              title="Enviar ícone customizado (PNG, até 200KB)"
              className={cn(
                'flex h-11 w-11 cursor-pointer items-center justify-center rounded-sm border text-[10px] font-semibold',
                stampIconType === 'custom'
                  ? 'border-royal-blue bg-royal-blue-subtle text-royal-blue'
                  : 'border-dashed border-border-strong text-text-muted'
              )}
            >
              {stampIconType === 'custom' && stampIconCustomUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stampIconCustomUrl} alt="Ícone customizado" className="h-6 w-6 object-contain" />
              ) : (
                'PNG'
              )}
              <input type="file" accept="image/png" onChange={handleIconChange} disabled={uploadingIcon} className="hidden" />
            </label>
          </div>
          {uploadingIcon && <p className="mt-1 text-xs text-text-muted">Enviando…</p>}
          {iconError && <p className="mt-1 text-xs text-error">{iconError}</p>}
        </div>

        <div>
          <label htmlFor="step1b-program-name" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Nome do programa
          </label>
          <Input
            id="step1b-program-name"
            value={programName}
            onChange={e => setProgramName(e.target.value.slice(0, 30))}
            placeholder="Ex: Clube do Farrapos"
          />
          <p className="mt-1 text-right text-[11px] text-text-muted">{programName.length}/30</p>
        </div>

        <div>
          <label htmlFor="step1b-stamp-label" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Texto do contador
          </label>
          <Input id="step1b-stamp-label" value={stampLabel} onChange={e => setStampLabel(e.target.value)} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Formato do código</label>
          <div className="flex gap-2">
            <BarcodeOption label="QR Code (recomendado)" selected={barcodeType === 'qr'} onClick={() => setBarcodeType('qr')} />
            <BarcodeOption label="Código de barras" selected={barcodeType === 'pdf417'} onClick={() => setBarcodeType('pdf417')} />
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Seu cartão pode aparecer levemente diferente no Google Wallet e Apple Wallet por limitações
          dessas plataformas. Na versão web é idêntico ao preview.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-text-secondary">Preview do card</p>
          <button type="button" onClick={() => setPreviewFilled(v => !v)} className="text-xs font-semibold text-royal-blue">
            {previewFilled ? 'Ver vazio' : 'Ver exemplo (3/5)'}
          </button>
        </div>
        <CardPreview
          programName={programName || 'Seu programa'}
          backgroundColor={backgroundColor}
          stampLabel={stampLabel}
          stampIcon={{ type: stampIconType, preset: stampIconPreset, customUrl: stampIconCustomUrl }}
          totalStamps={5}
          currentStamps={previewFilled ? 3 : 0}
        />
      </div>

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <Button variant="primary" size="full" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? 'Salvando…' : 'Continuar'}
      </Button>
    </div>
  );
}

function BarcodeOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex-1 rounded-sm border px-3 py-2.5 text-sm font-medium',
        selected ? 'border-royal-blue bg-royal-blue-subtle text-royal-blue' : 'border-border text-text-secondary'
      )}
    >
      {label}
    </button>
  );
}

// Amostra a logo num canvas pequeno e tira a cor média — sugestão inicial
// para a cor de fundo do card (Passo 1b). A matemática pura fica em
// lib/wizard/color.ts (testada); isto aqui é só a leitura de pixels via
// DOM, que não dá pra testar sem canvas real.
async function suggestColorFromImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no-canvas-context');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        resolve(averageColorFromPixels(data));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('image-load-failed'));
    img.src = url;
  });
}
