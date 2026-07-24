import { cn } from '@/lib/cn';
import { findStampIconPreset } from '@/lib/wizard/stampIconPresets';

export interface CardPreviewStampIcon {
  type: 'preset' | 'custom';
  preset?: string | null;
  customUrl?: string | null;
}

export interface CardPreviewProps {
  programName: string;
  backgroundColor: string;
  textColor?: string;
  stampLabel: string;
  stampIcon: CardPreviewStampIcon;
  logoUrl?: string | null;
  /** Quantos selos completam o marco exibido — não precisa ser um milestone real (ex: preview do wizard). */
  totalStamps: number;
  currentStamps: number;
  barcodeFormat?: 'qr' | 'pdf417' | 'aztec';
  isVip?: boolean;
  className?: string;
}

const BARCODE_LABEL: Record<NonNullable<CardPreviewProps['barcodeFormat']>, string> = {
  qr: 'QR',
  pdf417: 'Código de barras',
  aztec: 'Aztec',
};

// Card de fidelidade do cliente — usado no Passo 1b do wizard (preview ao
// vivo, com toggle vazio/exemplo controlado por quem chama) e, depois,
// pela Web Wallet real (spec-019) com os dados reais do customer_program.
// Por isso os props não dependem de nada específico do wizard: quem chama
// decide totalStamps/currentStamps (marco ilustrativo aqui, milestone real
// lá).
export default function CardPreview({
  programName,
  backgroundColor,
  textColor = '#FFFFFF',
  stampLabel,
  stampIcon,
  logoUrl,
  totalStamps,
  currentStamps,
  barcodeFormat = 'qr',
  isVip = false,
  className,
}: CardPreviewProps) {
  const preset = stampIcon.type === 'preset' ? findStampIconPreset(stampIcon.preset) : null;
  const filledCount = Math.max(0, Math.min(currentStamps, totalStamps));

  return (
    <div
      className={cn('w-full max-w-[360px] overflow-hidden rounded-2xl shadow-lg', className)}
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/15" />
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">Programa de fidelidade</p>
            <p className="truncate text-base font-bold">{programName || 'Programa'}</p>
          </div>
        </div>
        {isVip && (
          <span className="shrink-0 rounded-full bg-matte-yellow px-2.5 py-1 text-[10px] font-bold text-ink">
            VIP
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5 px-5 pb-4" role="img" aria-label={`${filledCount} de ${totalStamps} selos`}>
        {Array.from({ length: Math.max(totalStamps, 0) }).map((_, i) => {
          const filled = i < filledCount;
          const Icon = preset?.icon;
          return (
            <div
              key={i}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border',
                filled ? 'border-transparent bg-white' : 'border-white/30 bg-transparent'
              )}
            >
              {stampIcon.type === 'custom' && stampIcon.customUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={stampIcon.customUrl}
                  alt=""
                  className="h-5 w-5 object-contain"
                  style={{ opacity: filled ? 1 : 0.4 }}
                />
              ) : Icon ? (
                <Icon size={16} strokeWidth={2} color={filled ? backgroundColor : textColor} style={{ opacity: filled ? 1 : 0.4 }} />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-5 py-3 text-xs" style={{ borderColor: `${textColor}26` }}>
        <span className="opacity-80">{filledCount}/{totalStamps} {stampLabel}</span>
        <span className="shrink-0 rounded bg-white/15 px-2 py-1 font-data text-[10px] uppercase tracking-wide">
          {BARCODE_LABEL[barcodeFormat]}
        </span>
      </div>

      <div className="bg-black/10 px-5 py-2 text-center text-[10px] opacity-70">
        Feito com Remy
      </div>
    </div>
  );
}
