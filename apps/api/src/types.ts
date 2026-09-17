// Database types
export interface Salon {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Stylist {
  id: string;
  salon_id: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  salon_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  color_code?: string;
  description?: string;
  is_active: boolean;
  display_order?: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  stylist_id: string;
  customer_id: string;
  menu_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Chart {
  id: string;
  salon_id: string;
  customer_id: string;
  stylist_id: string;
  appointment_id?: string;
  shared_notes?: string;
  private_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  salon_id: string;
  sender_id: string;
  recipient_id: string;
  appointment_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface WorkerEnv {
  DB: D1Database;
}
