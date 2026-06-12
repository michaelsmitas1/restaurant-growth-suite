#!/usr/bin/env node
/**
 * Script de onboarding — configura um novo restaurante em < 5 minutos
 *
 * Uso:
 *   node scripts/onboard-restaurant.js
 *
 * Variáveis necessárias no ambiente (ou .env na raiz):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, SERVICE_URL
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Carrega .env se existir
try {
  const { config } = await import('dotenv');
  config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });
} catch {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:3001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question, defaultVal = '') =>
  new Promise((resolve) => {
    const hint = defaultVal ? ` [${defaultVal}]` : '';
    rl.question(`${question}${hint}: `, (ans) => resolve(ans.trim() || defaultVal));
  });

async function main() {
  console.log('\n🍽️  ══════════════════════════════════════');
  console.log('   Onboarding — Novo Restaurante');
  console.log('══════════════════════════════════════\n');

  const name = await ask('Nome do restaurante');
  if (!name) { console.error('❌ Nome obrigatório'); process.exit(1); }

  const type = await ask('Tipo (ex: sorveteria, self-service, restaurante de almoço)');
  const neighborhood = await ask('Bairro');
  const city = await ask('Cidade', 'São Paulo');
  const google_place_id = await ask('Google Place ID (de maps.google.com)');
  if (!google_place_id) { console.error('❌ Google Place ID obrigatório'); process.exit(1); }

  const whatsapp_number = await ask('WhatsApp do restaurante (formato: 5511999999999)');
  const stamps_required = parseInt(await ask('Quantos carimbos para a recompensa', '10')) || 10;
  const reward_description = await ask('Recompensa', 'item grátis da sua escolha');
  const tone_of_voice = await ask('Tom de voz', 'amigável e próximo');

  console.log('\n⏳ Criando restaurante no Supabase...');

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({
      name,
      type,
      neighborhood,
      city,
      google_place_id,
      whatsapp_number,
      stamps_required,
      reward_description,
      tone_of_voice,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar restaurante:', error.message);
    process.exit(1);
  }

  const walletUrl = `${SERVICE_URL}/wallet/${restaurant.id}`;
  const qrUrl = `${SERVICE_URL}/onboard/qr/${restaurant.id}`;

  // Salva resumo local
  const summary = {
    id: restaurant.id,
    name,
    walletUrl,
    qrUrl,
    stampUrl: `${SERVICE_URL}/stamp/${restaurant.id}`,
    createdAt: new Date().toISOString(),
  };

  const summaryPath = resolve(dirname(fileURLToPath(import.meta.url)), `../onboarding-${restaurant.id.slice(0, 8)}.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  rl.close();

  console.log('\n✅ ══════════════════════════════════════');
  console.log(`   ${name} configurado com sucesso!`);
  console.log('══════════════════════════════════════\n');
  console.log(`📋 ID:          ${restaurant.id}`);
  console.log(`🔗 Wallet URL:  ${walletUrl}`);
  console.log(`🖨️  QR Code:    ${qrUrl}`);
  console.log(`📄 Resumo:      ${summaryPath}`);
  console.log('\n📌 PRÓXIMOS PASSOS:\n');
  console.log('  1. Imprima o QR code e cole no balcão');
  console.log(`     → ${qrUrl}\n`);
  console.log('  2. Configure o Google OAuth:');
  console.log('     → Adicione redirect URI no Google Cloud Console');
  console.log(`     → URI: ${SERVICE_URL}/auth/google/callback\n`);
  console.log('  3. Conecte o WhatsApp do restaurante:');
  console.log(`     → Acesse: ${process.env.EVOLUTION_API_URL || 'http://localhost:8080'}`);
  console.log(`     → Crie instância: "${name.toLowerCase().replace(/\s+/g, '-')}"\n`);
  console.log('  4. Importe os workflows n8n:');
  console.log('     → Acesse seu n8n → Import Workflow');
  console.log('     → Importe cada arquivo de apps/n8n-workflows/ (ordem: 01, 02, 03, 04, 05)\n');
  console.log('  5. Configure as credenciais no n8n:');
  console.log('     → Supabase DB (PostgreSQL)');
  console.log('     → Anthropic API Key');
  console.log('     → Evolution API Key\n');
}

main().catch((e) => {
  console.error('Erro:', e.message);
  process.exit(1);
});
