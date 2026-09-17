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
  customer_name?: string;
  menu_name?: string;
  menu_duration?: number;
  menu_color?: string;
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
}

export interface Menu {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  color_code?: string;
  description?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  formatted: string; // "10:00" format
}

export interface StylistSchedule {
  stylist: Stylist;
  appointments: Appointment[];
}
