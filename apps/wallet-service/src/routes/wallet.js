import { Router } from 'express';
import { PKPass } from 'passkit-generator';
import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const walletRouter = Router();

// GET /wallet/:restaurantId
// Página de entrada — cliente escaneia QR e escolhe Apple ou Google Wallet
walletRouter.get('/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, reward_description, stamps_required')
    .eq('id', restaurantId)
    .single();

  if (!restaurant) return res.status(404).send('Restaurante não encontrado');

  const isIOS = /iPhone|iPad|iPod/i.test(req.headers['user-agent'] || '');
  const isAndroid = /Android/i.test(req.headers['user-agent'] || '');

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fidelidade — ${restaurant.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo { font-size: 40px; margin-bottom: 12px; }
    h1 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
    .subtitle { font-size: 15px; color: #666; margin-bottom: 28px; line-height: 1.5; }
    .reward-box {
      background: linear-gradient(135deg, #fff8e1, #fff3cd);
      border: 1px solid #fde68a;
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 28px;
    }
    .reward-box .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #d97706; }
    .reward-box .value { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 4px; }
    .stamps-hint { font-size: 13px; color: #888; margin-bottom: 4px; }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      border: none;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      margin-bottom: 12px;
      transition: transform 0.1s, opacity 0.1s;
    }
    .btn:active { transform: scale(0.98); opacity: 0.9; }
    .btn-apple { background: #000; color: white; }
    .btn-google { background: #4285f4; color: white; }
    .btn-secondary { background: #f3f4f6; color: #374151; font-size: 14px; }
    .footer { font-size: 12px; color: #bbb; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🍽️</div>
    <h1>${restaurant.name}</h1>
    <p class="subtitle">Seu cartão fidelidade digital.<br>Sem app, sem cadastro chato.</p>
    <div class="reward-box">
      <div class="label">🎁 Sua recompensa</div>
      <div class="value">${restaurant.reward_description}</div>
    </div>
    <p class="stamps-hint">Colecione ${restaurant.stamps_required} carimbos</p>
    ${isIOS ? `
    <a href="/wallet/${restaurantId}/apple" class="btn btn-apple">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      Adicionar ao Apple Wallet
    </a>
    ` : isAndroid ? `
    <a href="/wallet/${restaurantId}/google" class="btn btn-google">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
      Adicionar ao Google Wallet
    </a>
    ` : `
    <a href="/wallet/${restaurantId}/apple" class="btn btn-apple">
      🍎 Apple Wallet
    </a>
    <a href="/wallet/${restaurantId}/google" class="btn btn-google">
      🟢 Google Wallet
    </a>
    `}
    <p class="footer">Apresente na próxima visita para ganhar seu carimbo</p>
  </div>
</body>
</html>`);
});

// GET /wallet/:restaurantId/apple — gera e entrega o .pkpass
walletRouter.get('/:restaurantId/apple', async (req, res) => {
  const { restaurantId } = req.params;
  const { phone } = req.query;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single();

  if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });

  // Cria ou busca customer
  let customer;
  if (phone) {
    const { data } = await supabase
      .from('customers')
      .upsert({ restaurant_id: restaurantId, phone }, { onConflict: 'restaurant_id,phone' })
      .select()
      .single();
    customer = data;
  } else {
    const { data } = await supabase
      .from('customers')
      .insert({ restaurant_id: restaurantId })
      .select()
      .single();
    customer = data;
  }

  const serialNumber = customer.apple_pass_serial || uuidv4();
  if (!customer.apple_pass_serial) {
    await supabase.from('customers').update({ apple_pass_serial: serialNumber }).eq('id', customer.id);
  }

  const certsPath = path.join(__dirname, '../../certs');
  const modelPath = path.join(__dirname, '../../passmodel/stamp.pass');

  // Verifica se certificados existem
  if (!fs.existsSync(path.join(certsPath, 'signerCert.pem'))) {
    return res.status(503).json({
      error: 'Certificados Apple não configurados',
      setup: 'Veja README.md → seção Apple Wallet'
    });
  }

  try {
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: fs.readFileSync(path.join(certsPath, 'wwdr.pem')),
        signerCert: fs.readFileSync(path.join(certsPath, 'signerCert.pem')),
        signerKey: fs.readFileSync(path.join(certsPath, 'signerKey.pem')),
        signerKeyPassphrase: process.env.APPLE_CERT_PASSPHRASE
      }
    }, {
      serialNumber,
      description: `Fidelidade ${restaurant.name}`,
      organizationName: restaurant.name,
      logoText: restaurant.name,
    });

    pass.secondaryFields.push({
      key: 'stamps',
      label: 'Carimbos',
      value: `${customer.current_stamps || 0} de ${restaurant.stamps_required}`
    });

    pass.auxiliaryFields.push({
      key: 'reward',
      label: 'Recompensa',
      value: restaurant.reward_description
    });

    const stampUrl = `${process.env.SERVICE_URL}/stamp/${restaurantId}/${customer.id}`;
    pass.setBarcodes({
      message: stampUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1'
    });

    const buffer = pass.getAsBuffer();
    const filename = `fidelidade-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}.pkpass`;

    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);

  } catch (err) {
    console.error('Erro ao gerar pkpass:', err);
    res.status(500).json({ error: 'Erro ao gerar passe Apple', detail: err.message });
  }
});

// GET /wallet/:restaurantId/google — redireciona para Google Wallet save link
walletRouter.get('/:restaurantId/google', async (req, res) => {
  const { restaurantId } = req.params;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, google_wallet_class_id')
    .eq('id', restaurantId)
    .single();

  if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });

  if (!restaurant.google_wallet_class_id) {
    return res.redirect(`/wallet/${restaurantId}?msg=google_wallet_nao_configurado`);
  }

  // Cria customer anônimo
  const { data: customer } = await supabase
    .from('customers')
    .insert({ restaurant_id: restaurantId })
    .select()
    .single();

  // TODO: gerar JWT assinado para Google Wallet API
  // Por ora, redireciona para página principal com instrução
  res.redirect(`/wallet/${restaurantId}?platform=google&customer=${customer?.id}`);
});
