-- スタッフ認証（スタッフ選択 + 6桁PIN）と権限管理
-- 追加のみ。既存の列・データは変更しない。

-- 役割: 'owner' | 'admin' | 'staff' | 'stylist'（既存スタッフは 'stylist'）
ALTER TABLE stylists ADD COLUMN role TEXT NOT NULL DEFAULT 'stylist';
-- 予約を受けるスタッフか（受付・アシスタントは 0）。既存スタッフは 1 のまま
ALTER TABLE stylists ADD COLUMN accepts_bookings INTEGER NOT NULL DEFAULT 1;
-- 'pbkdf2-sha256$<iterations>$<salt>$<hash>'。NULL = PIN未設定（ログイン不可）
ALTER TABLE stylists ADD COLUMN pin_hash TEXT;
ALTER TABLE stylists ADD COLUMN pin_updated_at DATETIME;
ALTER TABLE stylists ADD COLUMN failed_pin_attempts INTEGER NOT NULL DEFAULT 0;
-- ロック解除時刻（UNIX ミリ秒）。NULL = ロックなし
ALTER TABLE stylists ADD COLUMN locked_until INTEGER;

-- staff / stylist に個別付与する権限（owner / admin は常に全権限なので行を持たない）
CREATE TABLE IF NOT EXISTS staff_permissions (
  stylist_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_by TEXT,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stylist_id, permission),
  FOREIGN KEY (stylist_id) REFERENCES stylists(id)
);

-- ログインセッション。トークン本体は保存せず SHA-256 ハッシュのみ持つ
-- 時刻はすべて UNIX ミリ秒
CREATE TABLE IF NOT EXISTS staff_sessions (
  token_hash TEXT PRIMARY KEY,
  stylist_id TEXT NOT NULL,
  app TEXT NOT NULL,               -- 'salon' | 'stylist'
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id)
);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_stylist_id ON staff_sessions(stylist_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at ON staff_sessions(expires_at);
