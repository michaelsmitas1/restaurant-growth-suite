/**
 * Envio de SMS — interface pronta, provider a definir (decisão aberta em
 * PLAN.md: Twilio vs. Zenvia/TotalVoice). O stub abaixo lança em runtime se
 * chamado sem SMS_PROVIDER_API_KEY configurado, para não falhar silenciosamente.
 */
export interface SmsProvider {
  send(phone: string, text: string): Promise<void>;
}

class UnconfiguredSmsProvider implements SmsProvider {
  async send(): Promise<void> {
    throw new Error(
      'Provider de SMS ainda não definido (ver decisão aberta em PLAN.md). ' +
      'Configure SMS_PROVIDER_API_KEY e implemente lib/sms/<provider>.ts.'
    );
  }
}

export function getSmsProvider(): SmsProvider {
  if (!process.env.SMS_PROVIDER_API_KEY) {
    return new UnconfiguredSmsProvider();
  }
  return new UnconfiguredSmsProvider();
}

export async function sendSmsText(phone: string, text: string): Promise<void> {
  const provider = getSmsProvider();
  await provider.send(phone, text);
}
