-- Test Salon
INSERT INTO salons (id, name, email, phone, address) 
VALUES ('salon-001', 'A10 Hairsalon', 'info@a10salon.jp', '090-1234-5678', 'Tokyo, Japan')
ON CONFLICT(id) DO NOTHING;

-- Test Stylists
INSERT INTO stylists (id, salon_id, name, email, phone, bio, is_active)
VALUES 
  ('stylist-001', 'salon-001', 'Tanaka', 'tanaka@salon.jp', '090-1234-5679', 'Senior stylist', 1),
  ('stylist-002', 'salon-001', 'Satou', 'satou@salon.jp', '090-1234-5680', 'Hair coloring specialist', 1),
  ('stylist-003', 'salon-001', 'Suzuki', 'suzuki@salon.jp', '090-1234-5681', 'Perm specialist', 1)
ON CONFLICT(id) DO NOTHING;

-- Test Customers
INSERT INTO customers (id, salon_id, name, phone, email, notes, is_active)
VALUES 
  ('customer-001', 'salon-001', 'Yamada Taro', '090-9999-0001', 'yamada@email.com', 'Regular customer', 1),
  ('customer-002', 'salon-001', 'Suzuki Hanako', '090-9999-0002', 'suzuki@email.com', 'Prefers natural look', 1),
  ('customer-003', 'salon-001', 'Tanaka Jiro', '090-9999-0003', 'tanaka@email.com', NULL, 1)
ON CONFLICT(id) DO NOTHING;

-- Test Menus
INSERT INTO menus (id, salon_id, name, duration_minutes, price, color_code, description, is_active, display_order)
VALUES 
  ('menu-001', 'salon-001', 'Cut', 30, 4500, '#FF6B6B', 'Regular haircut', 1, 1),
  ('menu-002', 'salon-001', 'Cut + Color', 90, 8500, '#4ECDC4', 'Haircut with coloring', 1, 2),
  ('menu-003', 'salon-001', 'Perm', 120, 8000, '#45B7D1', 'Permanent wave', 1, 3),
  ('menu-004', 'salon-001', 'Shampoo + Blow', 45, 3500, '#96CEB4', 'Shampoo and styling', 1, 4),
  ('menu-005', 'salon-001', 'Treatment', 30, 3000, '#FFEAA7', 'Hair treatment', 1, 5)
ON CONFLICT(id) DO NOTHING;

-- Test Working Hours
INSERT INTO working_hours (id, stylist_id, day_of_week, start_time, end_time, is_active)
VALUES 
  ('wh-001', 'stylist-001', 0, '09:00', '20:00', 1),
  ('wh-002', 'stylist-001', 1, '09:00', '20:00', 1),
  ('wh-003', 'stylist-001', 2, '09:00', '20:00', 1),
  ('wh-004', 'stylist-001', 3, '09:00', '20:00', 1),
  ('wh-005', 'stylist-001', 4, '09:00', '21:00', 1),
  ('wh-006', 'stylist-001', 5, '09:00', '21:00', 1),
  ('wh-007', 'stylist-001', 6, '10:00', '19:00', 1)
ON CONFLICT(id) DO NOTHING;

-- Test Appointments
INSERT INTO appointments (id, salon_id, stylist_id, customer_id, menu_id, start_time, end_time, status, notes)
VALUES 
  ('apt-001', 'salon-001', 'stylist-001', 'customer-001', 'menu-001', '2026-09-18 10:00:00', '2026-09-18 10:30:00', 'confirmed', 'Regular cut'),
  ('apt-002', 'salon-001', 'stylist-002', 'customer-002', 'menu-002', '2026-09-18 14:00:00', '2026-09-18 15:30:00', 'confirmed', 'Color change'),
  ('apt-003', 'salon-001', 'stylist-003', 'customer-003', 'menu-003', '2026-09-19 11:00:00', '2026-09-19 12:40:00', 'confirmed', NULL)
ON CONFLICT(id) DO NOTHING;

-- Test Charts
INSERT INTO charts (id, salon_id, customer_id, stylist_id, appointment_id, shared_notes, private_notes)
VALUES 
  ('chart-001', 'salon-001', 'customer-001', 'stylist-001', 'apt-001', 'Customer prefers short cut', 'Regular customer'),
  ('chart-002', 'salon-001', 'customer-002', 'stylist-002', 'apt-002', 'Warm tone color', 'Sensitive scalp'),
  ('chart-003', 'salon-001', 'customer-003', 'stylist-003', 'apt-003', 'First time perm', 'Thick hair')
ON CONFLICT(id) DO NOTHING;

-- Test Messages
INSERT INTO messages (id, salon_id, sender_id, recipient_id, appointment_id, content, is_read)
VALUES 
  ('msg-001', 'salon-001', 'stylist-001', 'customer-001', 'apt-001', 'See you tomorrow!', 0),
  ('msg-002', 'salon-001', 'customer-001', 'stylist-001', 'apt-001', 'Looking forward to it', 1),
  ('msg-003', 'salon-001', 'stylist-002', 'customer-002', 'apt-002', 'New arrival shampoo!', 0)
ON CONFLICT(id) DO NOTHING;
