import { Router } from 'express';
import { google } from 'googleapis';
import { supabase } from '../lib/supabase.js';

export const authRouter = Router();

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.SERVICE_URL}/auth/google/callback`
  );
}

// GET /auth/google/callback — Google redireciona aqui após autorização
// DEVE vir antes de /google/:restaurantId para não ser capturado pelo parâmetro
authRouter.get('/google/callback', async (req, res) => {
  const { code, state: restaurantId, error } = req.query;

  if (error) {
    return res.redirect(`/auth/error?msg=${encodeURIComponent('Autorização negada pelo Google')}`);
  }

  if (!code || !restaurantId) {
    return res.redirect('/auth/error?msg=parametros_invalidos');
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // Salva tokens no Supabase (criptografia básica via Supabase RLS)
    await supabase
      .from('restaurants')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq('id', restaurantId);

    res.redirect(`/auth/success?restaurant=${restaurantId}`);
  } catch (err) {
    console.error('Erro no callback OAuth:', err);
    res.redirect(`/auth/error?msg=${encodeURIComponent(err.message)}`);
  }
});

// GET /auth/google/:restaurantId — inicia fluxo OAuth
authRouter.get('/google/:restaurantId', (req, res) => {
  const { restaurantId } = req.params;
  const oauth2Client = getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: restaurantId,
  });

  res.redirect(url);
});

// GET /auth/success — página de sucesso
authRouter.get('/success', async (req, res) => {
  const { restaurant: restaurantId } = req.query;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single();

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google conectado!</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 20px; padding: 40px 32px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #1a1a1a; }
    p { font-size: 15px; color: #6b7280; line-height: 1.5; margin-bottom: 24px; }
    .badge { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 99px; padding: 6px 16px; font-size: 13px; font-weight: 600; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Google conectado!</h1>
    <p>O <strong>${restaurant?.name || 'restaurante'}</strong> agora pode receber e responder avaliações automaticamente.</p>
    <span class="badge">● Google Business ativo</span>
  </div>
</body>
</html>`);
});

// GET /auth/error — página de erro
authRouter.get('/error', (req, res) => {
  const { msg } = req.query;
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro de autorização</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #fff0f1; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 20px; padding: 40px 32px; max-width: 400px; width: 100%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #1a1a1a; }
    p { font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Erro de autorização</h1>
    <p>${msg || 'Não foi possível conectar ao Google. Tente novamente.'}</p>
  </div>
</body>
</html>`);
});

// GET /auth/status/:restaurantId — verifica se está autorizado
authRouter.get('/status/:restaurantId', async (req, res) => {
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('google_refresh_token, google_token_expires_at, name')
    .eq('id', req.params.restaurantId)
    .single();

  if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });

  const hasToken = !!restaurant.google_refresh_token;
  const expired = restaurant.google_token_expires_at
    ? new Date(restaurant.google_token_expires_at) < new Date()
    : false;

  res.json({
    connected: hasToken && !expired,
    hasRefreshToken: hasToken,
    expired,
    connectUrl: `${process.env.SERVICE_URL}/auth/google/${req.params.restaurantId}`,
  });
});
