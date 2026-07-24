'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { saveStep2 } from '@/lib/wizard/step2';
import type { WizardStepProps } from '@/lib/wizard/types';

interface VerifiedPlace {
  name: string | null;
  address: string | null;
  photoUrl: string | null;
}

export default function Step2({ restaurantId, onSaved }: WizardStepProps) {
  const [googleLink, setGoogleLink] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [verifiedPlace, setVerifiedPlace] = useState<VerifiedPlace | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Retomando um restaurante já iniciado: carrega o que já foi salvo.
  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('google_place_id, google_review_link, instagram_handle, facebook_url, social_tiktok, social_website')
        .eq('id', restaurantId)
        .maybeSingle();
      if (cancelled || !data) return;
      setGooglePlaceId(data.google_place_id ?? null);
      setGoogleReviewLink(data.google_review_link ?? '');
      setSocialInstagram(data.instagram_handle ?? '');
      setSocialFacebook(data.facebook_url ?? '');
      setSocialTiktok(data.social_tiktok ?? '');
      setSocialWebsite(data.social_website ?? '');
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  async function handleVerify() {
    if (!googleLink.trim() || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/verify-google-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: googleLink.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Não foi possível verificar.');
      setVerifiedPlace({ name: json.name ?? null, address: json.address ?? null, photoUrl: json.photoUrl ?? null });
      setGooglePlaceId(json.placeId);
      setGoogleReviewLink(json.reviewLink ?? '');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Não foi possível verificar.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    if (!restaurantId || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await saveStep2({
        restaurantId,
        googlePlaceId,
        googleReviewLink: googleReviewLink || null,
        socialInstagram: socialInstagram || null,
        socialFacebook: socialFacebook || null,
        socialTiktok: socialTiktok || null,
        socialWebsite: socialWebsite || null,
      });
      onSaved(result.restaurantId, 3);
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
        <h1 className="font-display text-xl font-bold text-text-primary">Google e redes sociais</h1>
        <p className="mt-1 text-sm text-text-secondary">Tudo aqui é opcional — você pode preencher depois.</p>
      </div>

      <div className="space-y-4 rounded-lg bg-surface p-5 shadow-sm">
        <div>
          <label htmlFor="step2-google-link" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Link do seu Google Business
          </label>
          <div className="flex gap-2">
            <Input
              id="step2-google-link"
              value={googleLink}
              onChange={e => setGoogleLink(e.target.value)}
              placeholder="Cole o link do Google Maps"
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleVerify} disabled={verifying || !googleLink.trim()}>
              {verifying ? 'Verificando…' : 'Verificar'}
            </Button>
          </div>
          {verifyError && <p className="mt-1 text-xs text-error">{verifyError}</p>}
          {verifiedPlace && (
            <div className="mt-2 flex items-center gap-3 rounded-sm border border-success bg-success-soft p-3">
              {verifiedPlace.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={verifiedPlace.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{verifiedPlace.name}</p>
                <p className="truncate text-xs text-text-secondary">{verifiedPlace.address}</p>
              </div>
            </div>
          )}
          {googlePlaceId && !verifiedPlace && (
            <p className="mt-1 text-xs text-success">Google Business já conectado.</p>
          )}
        </div>

        <div>
          <label htmlFor="step2-review-link" className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Link de review
          </label>
          <Input
            id="step2-review-link"
            value={googleReviewLink}
            onChange={e => setGoogleReviewLink(e.target.value)}
            placeholder="Gerado automaticamente ao verificar"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="step2-instagram" className="mb-1.5 block text-xs font-semibold text-text-secondary">Instagram</label>
            <Input id="step2-instagram" value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="@seurestaurante" />
          </div>
          <div>
            <label htmlFor="step2-facebook" className="mb-1.5 block text-xs font-semibold text-text-secondary">Facebook</label>
            <Input id="step2-facebook" value={socialFacebook} onChange={e => setSocialFacebook(e.target.value)} placeholder="facebook.com/seurestaurante" />
          </div>
          <div>
            <label htmlFor="step2-tiktok" className="mb-1.5 block text-xs font-semibold text-text-secondary">TikTok</label>
            <Input id="step2-tiktok" value={socialTiktok} onChange={e => setSocialTiktok(e.target.value)} placeholder="@seurestaurante" />
          </div>
          <div>
            <label htmlFor="step2-website" className="mb-1.5 block text-xs font-semibold text-text-secondary">Site</label>
            <Input id="step2-website" value={socialWebsite} onChange={e => setSocialWebsite(e.target.value)} placeholder="seurestaurante.com.br" />
          </div>
        </div>
      </div>

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <Button variant="primary" size="full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Salvando…' : 'Continuar'}
      </Button>
    </div>
  );
}
