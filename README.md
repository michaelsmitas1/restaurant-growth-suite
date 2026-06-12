# 🍽️ Restaurante Growth Suite — MVP

Suite de crescimento automático para restaurantes presenciais brasileiros.
**Zero operação pelo dono. Tudo roda sozinho.**

---

## O que faz

| Bloco | Descrição |
|---|---|
| 🌟 **Reputação** | Monitora Google, Claude gera resposta, dono aprova via WhatsApp em 1 toque |
| 💳 **Wallet** | Stamp card digital Apple/Google Wallet via QR — sem app, sem cadastro |
| 📲 **Campanhas** | Reativação de clientes sumidos + slow day de terça automático |

---

## Stack

- **n8n** — orquestração de todos os fluxos
- **Evolution API** — WhatsApp envio/recebimento
- **Claude API** (Anthropic) — geração de respostas e mensagens
- **passkit-generator** — geração de passes Apple Wallet
- **Supabase** (PostgreSQL) — banco de dados
- **Next.js 14** — dashboard do dono
- **Railway** — hospedagem de todos os serviços

---

## Setup em 1 dia

### Pré-requisitos

- [ ] Conta [Railway](https://railway.app)
- [ ] Projeto [Supabase](https://supabase.com) criado
- [ ] [API Key Anthropic](https://console.anthropic.com)
- [ ] [Apple Developer Program](https://developer.apple.com) (U$99/ano)
- [ ] Google Cloud Project com APIs habilitadas

---

### Passo 1 — Supabase (banco de dados)

1. Acesse seu projeto Supabase → **SQL Editor**
2. Execute todo o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Copie em **Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` → `SUPABASE_SERVICE_KEY`
   - `DB Password` → `SUPABASE_DB_PASSWORD`

---

### Passo 2 — Google Cloud (APIs do Google Business + Wallet)

> ⚠️ **Faça isso primeiro** — verificação do app leva até 4 semanas

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo (ex: "restaurante-growth")
3. Em **APIs & Services → Enable APIs**, habilite:
   - `My Business Account Management API`
   - `My Business Reviews API`
   - `Google Wallet API`
4. Em **OAuth consent screen**: configure como externo, adicione scopes das APIs acima
5. Em **Credentials → Create OAuth Client ID**:
   - Tipo: Web Application
   - Redirect URI: `https://wallet.seudominio.com/auth/google/callback`
   - Copie Client ID e Client Secret
6. **Submeta para verificação** (menu OAuth consent screen → Publish App)

---

### Passo 3 — Apple Wallet (certificados)

1. Acesse [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles
2. Em **Identifiers → Pass Type IDs**: crie `pass.com.seuapp.fidelidade`
3. Em **Certificates**: crie um certificado para esse Pass Type ID
4. Baixe o `.cer` e converta para `.p12` (via Keychain Access no Mac)
5. Converta para PEM:

```bash
# Gera signerCert.pem (certificado público)
openssl pkcs12 -in certificado.p12 -out apps/wallet-service/certs/signerCert.pem \
  -clcerts -nokeys -passin pass:SUA_SENHA

# Gera signerKey.pem (chave privada)
openssl pkcs12 -in certificado.p12 -out apps/wallet-service/certs/signerKey.pem \
  -nocerts -passin pass:SUA_SENHA -passout pass:SUA_SENHA
```

6. Baixe o **WWDR G4** em [developer.apple.com/certificationauthority](https://www.apple.com/certificateauthority/):
   - Arquivo: `AppleWWDRCAG4.cer`
   - Converta: `openssl x509 -inform DER -in AppleWWDRCAG4.cer -out apps/wallet-service/certs/wwdr.pem`

7. Crie o modelo do passe em `apps/wallet-service/passmodel/stamp.pass/`:

```
stamp.pass/
├── pass.json          ← estrutura do passe
├── icon.png           ← ícone 29x29
├── icon@2x.png        ← ícone 58x58
├── logo.png           ← logo 160x50
└── logo@2x.png        ← logo 320x100
```

Exemplo de `pass.json`:
```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.seuapp.fidelidade",
  "teamIdentifier": "SEU_TEAM_ID",
  "organizationName": "Growth Suite",
  "description": "Cartão Fidelidade",
  "backgroundColor": "rgb(255, 255, 255)",
  "foregroundColor": "rgb(26, 26, 26)",
  "storeCard": {
    "primaryFields": [],
    "secondaryFields": [],
    "auxiliaryFields": [],
    "backFields": []
  }
}
```

---

### Passo 4 — Railway (deploy dos serviços)

#### Instale Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### Deploy do wallet-service
```bash
cd apps/wallet-service
railway init    # cria projeto
railway up      # deploy
```

Configure as variáveis no painel Railway:
```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SERVICE_URL=https://wallet-production-xxxx.up.railway.app
APPLE_CERT_PASSPHRASE=...
```

> Após o deploy, adicione os certificados Apple via **Volume** no Railway
> (Settings → Volumes → monte em `/app/certs`)

#### Deploy do Dashboard
```bash
cd apps/dashboard
railway init
railway up
```

Variáveis:
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

#### Deploy do n8n
No Railway, crie um serviço com imagem Docker:
- Imagem: `docker.n8n.io/n8nio/n8n:latest`
- Port: `5678`
- Volume em `/home/node/.n8n`

Adicione todas as variáveis do `.env.example` (seção n8n).

#### Deploy da Evolution API
Serviço Docker no Railway:
- Imagem: `atendai/evolution-api:v2.1.1`
- Port: `8080`

Adicione todas as variáveis do `.env.example` (seção Evolution API).

---

### Passo 5 — Onboarding do primeiro restaurante

```bash
# Na raiz do projeto
cp .env.example .env
# Preencha SUPABASE_URL, SUPABASE_SERVICE_KEY e SERVICE_URL

node scripts/onboard-restaurant.js
```

O script pergunta os dados e cria o restaurante no banco.
Ao final, gera um arquivo `onboarding-XXXXXXXX.json` com o QR code URL.

**Imprima o QR code e cole no balcão:**
```
https://wallet.seudominio.com/onboard/qr/ID_DO_RESTAURANTE
```

---

### Passo 6 — Conectar WhatsApp do restaurante

1. Acesse a Evolution API: `https://evolution.seudominio.com`
2. Crie uma instância para o restaurante:

```bash
curl -X POST https://evolution.seudominio.com/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "nome-do-restaurante", "qrcode": true}'
```

3. Conecte via QR code:
```bash
curl https://evolution.seudominio.com/instance/connect/nome-do-restaurante \
  -H "apikey: SUA_API_KEY"
```

4. Abra o WhatsApp do restaurante → escaneie o QR code exibido

> **Anti-ban:** cada restaurante tem sua própria instância/sessão.
> Limite recomendado: 50 msgs/hora, 200/dia, apenas 9h–20h.

---

### Passo 7 — Importar workflows n8n

1. Acesse `https://n8n.seudominio.com`
2. Vá em **Settings → Import Workflow**
3. Importe nesta ordem:
   - `apps/n8n-workflows/01-reviews-auto-response.json`
   - `apps/n8n-workflows/02-whatsapp-approval-handler.json`
   - `apps/n8n-workflows/03-auto-publish-expired.json`
   - `apps/n8n-workflows/04-reactivation-campaign.json`
   - `apps/n8n-workflows/05-slow-day-campaign.json`

4. Para cada workflow, configure as credenciais:
   - **Supabase DB**: PostgreSQL → host: `db.xxxx.supabase.co`, port: 5432, db: postgres, user: postgres
   - **Anthropic API**: sua API key
   - Variáveis de ambiente já são lidas automaticamente via `$env.NOME`

5. Ative cada workflow (toggle no canto superior)

---

### Passo 8 — Configurar webhook do Google Business

Para receber reviews automaticamente:

1. Configure uma tarefa no n8n (Schedule Trigger) para **polling** da API do Google a cada 15 min
   *(Google Business não tem webhook nativo — é polling)*
2. Endpoint da API para listar reviews:
   ```
   GET https://mybusiness.googleapis.com/v4/{account}/locations/{location}/reviews
   ```
3. Use o OAuth refresh token salvo no Supabase para autenticar

---

## Estrutura do projeto

```
restaurante-growth-suite/
├── apps/
│   ├── dashboard/              # Next.js 14 — painel do dono
│   │   └── src/
│   │       ├── app/            # App Router pages
│   │       ├── components/     # ReviewsList, CustomersList, etc.
│   │       └── lib/supabase/   # Client Supabase server-side
│   ├── wallet-service/         # Node.js — gera passes Wallet + registro de carimbos
│   │   ├── src/routes/         # wallet.js, stamp.js, onboard.js
│   │   ├── certs/              # certificados Apple (não commitar!)
│   │   └── passmodel/          # template do .pkpass
│   └── n8n-workflows/          # JSONs importáveis no n8n
│       ├── 01-reviews-auto-response.json
│       ├── 02-whatsapp-approval-handler.json
│       ├── 03-auto-publish-expired.json
│       ├── 04-reactivation-campaign.json
│       └── 05-slow-day-campaign.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── infra/
│   └── docker-compose.yml      # para desenvolvimento local
├── scripts/
│   └── onboard-restaurant.js   # CLI de onboarding
├── .env.example
└── README.md
```

---

## Custo estimado (20 restaurantes)

| Serviço | Custo/mês |
|---|---|
| Railway — n8n + Evolution + Wallet + Dashboard | R$ 150–200 |
| Supabase — free tier até 50k rows | Grátis |
| Claude API — Haiku (campanhas) + Sonnet (reviews) | R$ 50–100 |
| Apple Developer Program | R$ 46 (R$ 550/ano) |
| **Total** | **~R$ 250–350/mês** |

---

## Fluxos automáticos

```
📥 Nova review Google
   └─ Claude analisa sentimento + gera resposta
      └─ Dono recebe no WhatsApp: "1=publicar, 2=editar, 3=ignorar"
         └─ Resposta publicada no Google
            └─ Se sem resposta em 4h → publica automaticamente

📱 Cliente escaneia QR no balcão
   └─ Abre página → adiciona ao Apple/Google Wallet
      └─ Na próxima visita: funcionário escaneia QR do Wallet
         └─ Carimbo registrado
            └─ Ao completar X carimbos → notificação de recompensa
               └─ Se sem telefone → balcão coleta número

⏰ Todo dia às 10h
   └─ Busca clientes sem visita há 21+ dias
      └─ Claude gera mensagem personalizada
         └─ Enviada via WhatsApp do restaurante

⏰ Toda terça às 10h30
   └─ Busca todos clientes ativos (2+ visitas)
      └─ Claude gera mensagem de slow day
         └─ Enviada via WhatsApp do restaurante
```

---

## Próximos passos (pós-MVP)

- [ ] Google Wallet API completo (JWT + save link)
- [ ] Self-service onboarding com OAuth flow no browser
- [ ] iFood Merchant API — analytics e respostas de avaliações
- [ ] Calendário sazonal BR (Carnaval, Dia das Mães, Festa Junina, etc.)
- [ ] Multi-restaurante no dashboard com switcher
- [ ] Relatório semanal automático via WhatsApp
- [ ] Push notification via PassKit quando carimbo completa

---

## Segurança

- Nunca commite os arquivos `certs/` nem o `.env`
- O `.gitignore` já os exclui
- `SUPABASE_SERVICE_KEY` só fica no servidor (Next.js server components)
- Tokens Google OAuth ficam criptografados no Supabase
