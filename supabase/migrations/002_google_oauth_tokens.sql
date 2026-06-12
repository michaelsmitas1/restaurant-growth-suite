ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS google_access_token      TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token     TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_account_id        TEXT;
