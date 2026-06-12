import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import QRCode from 'qrcode';

export const onboardRouter = Router();

// POST /onboard/restaurant — cria novo restaurante e retorna QR code
onboardRouter.post('/restaurant', async (req, res) => {
  const {
    name, type, neighborhood, city,
    google_place_id, whatsapp_number,
    tone_of_voice, stamps_required, reward_description
  } = req.body;

  if (!name || !google_place_id) {
    return res.status(400).json({ error: 'name e google_place_id são obrigatórios' });
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({
      name,
      type,
      neighborhood,
      city: city || 'São Paulo',
      google_place_id,
      whatsapp_number,
      tone_of_voice: tone_of_voice || 'amigável e próximo',
      stamps_required: stamps_required || 10,
      reward_description: reward_description || 'item grátis da sua escolha'
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const walletUrl = `${process.env.SERVICE_URL}/wallet/${restaurant.id}`;
  const stampBaseUrl = `${process.env.SERVICE_URL}/stamp/${restaurant.id}`;
  const qrUrl = `${process.env.SERVICE_URL}/onboard/qr/${restaurant.id}`;
  const qrCodeDataUrl = await QRCode.toDataURL(walletUrl, { width: 400, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } });

  res.json({
    restaurant,
    walletUrl,
    stampBaseUrl,
    qrUrl,
    qrCodeDataUrl,
    proximos_passos: [
      `1. Imprima o QR code: ${qrUrl}`,
      `2. Cole no balcão com a frase: "Escaneie para ganhar pontos"`,
      `3. Configure o Google OAuth: adicione o google_place_id no Google Cloud`,
      `4. Conecte o WhatsApp ${whatsapp_number} na Evolution API`,
      `5. Importe os workflows n8n da pasta apps/n8n-workflows/`
    ]
  });
});

// GET /onboard/qr/:restaurantId — retorna QR code como imagem PNG
onboardRouter.get('/qr/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  const { size = 600 } = req.query;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', restaurantId)
    .single();

  if (!restaurant) return res.status(404).send('Restaurante não encontrado');

  const walletUrl = `${process.env.SERVICE_URL}/wallet/${restaurantId}`;

  const qrBuffer = await QRCode.toBuffer(walletUrl, {
    width: Math.min(parseInt(size), 1200),
    margin: 3,
    color: { dark: '#1a1a1a', light: '#ffffff' }
  });

  res.set({
    'Content-Type': 'image/png',
    'Content-Disposition': `inline; filename="qr-${restaurant.name.toLowerCase().replace(/\s+/g, '-')}.png"`
  });
  res.send(qrBuffer);
});

// GET /onboard/restaurantes — lista todos os restaurantes (para admin)
onboardRouter.get('/restaurantes', async (req, res) => {
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, type, city, active, created_at')
    .order('created_at', { ascending: false });

  res.json(restaurants || []);
});
