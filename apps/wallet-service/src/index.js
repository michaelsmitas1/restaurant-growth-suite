import express from 'express';
import dotenv from 'dotenv';
import { walletRouter } from './routes/wallet.js';
import { stampRouter } from './routes/stamp.js';
import { onboardRouter } from './routes/onboard.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

const app = express();
app.use(express.json());

// CORS básico
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/wallet', walletRouter);
app.use('/stamp', stampRouter);
app.use('/onboard', onboardRouter);
app.use('/auth', authRouter);

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ wallet-service rodando na porta ${PORT}`);
  console.log(`   URL: ${process.env.SERVICE_URL || `http://localhost:${PORT}`}`);
});
