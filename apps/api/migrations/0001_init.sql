-- Salons table
CREATE TABLE IF NOT EXISTS salons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stylists table
CREATE TABLE IF NOT EXISTS stylists (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  UNIQUE(salon_id, phone)
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  color_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id)
);

-- Working Hours table
CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY,
  stylist_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id),
  UNIQUE(stylist_id, day_of_week)
);

-- Off Days table
CREATE TABLE IF NOT EXISTS off_days (
  id TEXT PRIMARY KEY,
  stylist_id TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id),
  UNIQUE(stylist_id, date)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  stylist_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  menu_id TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (stylist_id) REFERENCES stylists(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (menu_id) REFERENCES menus(id)
);

-- Charts/Kartes table
CREATE TABLE IF NOT EXISTS charts (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  stylist_id TEXT NOT NULL,
  appointment_id TEXT,
  shared_notes TEXT,
  private_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (stylist_id) REFERENCES stylists(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Chart Photos table
CREATE TABLE IF NOT EXISTS chart_photos (
  id TEXT PRIMARY KEY,
  chart_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chart_id) REFERENCES charts(id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  appointment_id TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stylists_salon_id ON stylists(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_salon_id ON customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_menus_salon_id ON menus(salon_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_stylist_id ON working_hours(stylist_id);
CREATE INDEX IF NOT EXISTS idx_off_days_stylist_id ON off_days(stylist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_stylist_id ON appointments(stylist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_charts_customer_id ON charts(customer_id);
CREATE INDEX IF NOT EXISTS idx_charts_stylist_id ON charts(stylist_id);
CREATE INDEX IF NOT EXISTS idx_messages_salon_id ON messages(salon_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
