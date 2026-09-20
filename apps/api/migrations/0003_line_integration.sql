-- LINE Users mapping
CREATE TABLE IF NOT EXISTS line_users (
  id TEXT PRIMARY KEY,
  line_user_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  line_profile_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Booking Sessions (for multi-step LINE booking flow)
CREATE TABLE IF NOT EXISTS booking_sessions (
  id TEXT PRIMARY KEY,
  line_user_id TEXT NOT NULL,
  step TEXT NOT NULL,
  menu_id TEXT,
  menu_name TEXT,
  stylist_id TEXT,
  stylist_name TEXT,
  datetime TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (line_user_id) REFERENCES line_users(line_user_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id),
  FOREIGN KEY (stylist_id) REFERENCES stylists(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON line_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_customer_id ON line_users(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_line_user_id ON booking_sessions(line_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_step ON booking_sessions(step);
