import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const stampRouter = Router();

// GET /stamp/:restaurantId/:customerId
// Página HTML que o funcionário vê ao escanear o QR do Wallet do cliente
stampRouter.get('/:restaurantId/:customerId', async (req, res) => {
  const { restaurantId, customerId } = req.params;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, stamps_required, reward_description')
    .eq('id', restaurantId)
    .single();

  const { data: customer } = await supabase
    .from('customers')
    .select('name, phone, current_stamps, total_visits')
    .eq('id', customerId)
    .single();

  if (!restaurant || !customer) {
    return res.status(404).send('<h2>QR inválido</h2>');
  }

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carimbar — ${restaurant.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, sans-serif;
      background: #f0fdf4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 340px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .restaurant { font-size: 13px; color: #888; margin-bottom: 4px; }
    h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .stats { font-size: 14px; color: #666; margin-bottom: 24px; }
    .progress-bar {
      background: #f3f4f6;
      border-radius: 99px;
      height: 10px;
      margin-bottom: 8px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border-radius: 99px;
      transition: width 0.5s ease;
      width: calc(${(customer.current_stamps / restaurant.stamps_required) * 100}%);
    }
    .progress-label { font-size: 12px; color: #888; margin-bottom: 28px; }
    .btn {
      width: 100%;
      padding: 18px;
      border-radius: 14px;
      border: none;
      font-size: 18px;
      font-weight: 800;
      cursor: pointer;
      background: #22c55e;
      color: white;
      transition: transform 0.1s;
    }
    .btn:active { transform: scale(0.97); }
    .btn:disabled { background: #d1d5db; cursor: not-allowed; }
    #result { margin-top: 20px; font-size: 17px; font-weight: 600; line-height: 1.5; }
    .reward-alert {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 14px;
      padding: 20px;
      font-size: 20px;
      font-weight: 800;
      color: #92400e;
    }
    .phone-form { margin-top: 20px; }
    .phone-form input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 16px;
      margin-bottom: 10px;
      outline: none;
    }
    .phone-form input:focus { border-color: #22c55e; }
    .phone-form button {
      width: 100%;
      padding: 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="restaurant">${restaurant.name}</p>
    <h2>${customer.name || 'Cliente'}</h2>
    <p class="stats">${customer.total_visits} visitas • ${customer.phone || 'sem telefone'}</p>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <p class="progress-label">${customer.current_stamps} de ${restaurant.stamps_required} carimbos</p>
    <button class="btn" id="btn" onclick="carimbar()">✅ Registrar visita</button>
    <div id="result"></div>
  </div>

  <script>
    let done = false;
    async function carimbar() {
      if (done) return;
      done = true;
      const btn = document.getElementById('btn');
      btn.disabled = true;
      btn.textContent = 'Registrando...';

      try {
        const res = await fetch('/stamp/${restaurantId}/${customerId}', { method: 'POST' });
        const data = await res.json();
        const div = document.getElementById('result');

        if (data.rewardTriggered) {
          div.innerHTML = '<div class="reward-alert">🎉 RECOMPENSA!<br>' + data.rewardMessage + '</div>';
          btn.textContent = '🎉 Recompensa!';
        } else {
          btn.textContent = '✅ Carimbado!';
          div.innerHTML = '⭐ ' + data.stamps + ' de ' + data.stampsRequired + ' carimbos';
        }

        if (data.collectPhone) {
          div.innerHTML += '<div class="phone-form"><p style="margin:12px 0 8px;font-size:13px;color:#666">Colete o WhatsApp para promoções:</p><input type="tel" id="phoneInput" placeholder="(11) 99999-9999"><button onclick="salvarPhone()">Salvar número</button></div>';
        }
      } catch(e) {
        btn.disabled = false;
        btn.textContent = '✅ Registrar visita';
        done = false;
        document.getElementById('result').textContent = '⚠️ Erro. Tente novamente.';
      }
    }

    async function salvarPhone() {
      const phone = document.getElementById('phoneInput').value.replace(/\\D/g, '');
      if (phone.length < 10) return alert('Número inválido');
      await fetch('/stamp/${restaurantId}/${customerId}/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '55' + phone })
      });
      document.querySelector('.phone-form').innerHTML = '<p style="color:#22c55e;font-weight:600;margin-top:8px">✅ Número salvo!</p>';
    }
  </script>
</body>
</html>`);
});

// POST /stamp/:restaurantId/:customerId — registra o carimbo
stampRouter.post('/:restaurantId/:customerId', async (req, res) => {
  const { restaurantId, customerId } = req.params;

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('stamps_required, reward_description, name')
    .eq('id', restaurantId)
    .single();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('restaurant_id', restaurantId)
    .single();

  if (!restaurant || !customer) {
    return res.status(404).json({ error: 'Não encontrado' });
  }

  const newStamps = (customer.current_stamps || 0) + 1;
  const totalVisits = (customer.total_visits || 0) + 1;
  const rewardTriggered = newStamps >= restaurant.stamps_required;
  const finalStamps = rewardTriggered ? 0 : newStamps;

  await supabase.from('customers').update({
    current_stamps: finalStamps,
    total_visits: totalVisits,
    last_visit_at: new Date().toISOString()
  }).eq('id', customerId);

  await supabase.from('visits').insert({
    customer_id: customerId,
    restaurant_id: restaurantId,
    stamps_added: 1,
    stamp_count_after: finalStamps,
    reward_triggered: rewardTriggered
  });

  const response = {
    ok: true,
    stamps: finalStamps,
    stampsRequired: restaurant.stamps_required,
    rewardTriggered,
    customerPhone: customer.phone,
    collectPhone: !customer.phone
  };

  if (rewardTriggered) {
    response.rewardMessage = `${customer.name || 'Cliente'} ganhou: ${restaurant.reward_description}`;
  }

  return res.json(response);
});

// POST /stamp/:restaurantId/:customerId/phone — salva telefone coletado no balcão
stampRouter.post('/:restaurantId/:customerId/phone', async (req, res) => {
  const { customerId, restaurantId } = req.params;
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ error: 'phone obrigatório' });

  await supabase.from('customers')
    .update({ phone })
    .eq('id', customerId)
    .eq('restaurant_id', restaurantId);

  res.json({ ok: true });
});
