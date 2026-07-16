'use client';

export default function PrintQRButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8,
        background: '#f3f4f6', color: 'var(--text-secondary)',
        border: 'none', cursor: 'pointer',
      }}
    >
      🖨 Imprimir QR
    </button>
  );
}
