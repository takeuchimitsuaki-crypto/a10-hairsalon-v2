-- Menu Sets table (for multi-menu combinations)
CREATE TABLE IF NOT EXISTS menu_sets (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  total_price REAL NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  color_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id)
);

-- Menu Set Items table (menus included in a set)
CREATE TABLE IF NOT EXISTS menu_set_items (
  id TEXT PRIMARY KEY,
  menu_set_id TEXT NOT NULL,
  menu_id TEXT NOT NULL,
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_set_id) REFERENCES menu_sets(id),
  FOREIGN KEY (menu_id) REFERENCES menus(id)
);

-- Private Time table (for stylist private time blocks)
CREATE TABLE IF NOT EXISTS private_time (
  id TEXT PRIMARY KEY,
  stylist_id TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_sets_salon_id ON menu_sets(salon_id);
CREATE INDEX IF NOT EXISTS idx_menu_set_items_menu_set_id ON menu_set_items(menu_set_id);
CREATE INDEX IF NOT EXISTS idx_menu_set_items_menu_id ON menu_set_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_private_time_stylist_id ON private_time(stylist_id);
CREATE INDEX IF NOT EXISTS idx_private_time_start_time ON private_time(start_time);
