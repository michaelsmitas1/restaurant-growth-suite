/**
 * Envio de texto via Evolution API (WhatsApp), usado pelo OTP e pelas
 * automações (spec-004). Instância compartilhada do Remy — não é a
 * instância do restaurante (essa é usada nas automações de cada restaurante,
 * via n8n).
 */
export async function sendWhatsAppText(phone: string, text: string): Promise<void> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE ?? 'remy';

  if (!apiUrl || !apiKey) {
    throw new Error('EVOLUTION_API_URL/EVOLUTION_API_KEY não configurados');
  }

  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone.replace('+', ''),
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Evolution API respondeu ${response.status}`);
  }
}
